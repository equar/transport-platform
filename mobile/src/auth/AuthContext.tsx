import { stopTripTracking } from '../tracking/activeTrip';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { authApi, type LoginPayload } from '@api/authApi';
import { SESSION_KEY, onSessionExpired, onSessionRefreshed, invalidateSessionRequests } from '@api/client';
import type { AuthSession } from './types';
import { Roles } from './types';
import { deleteSessionValue, getSessionValue, setSessionValue } from './sessionStorage';
import { unregisterCurrentPushToken } from '@hooks/usePushNotifications';
import { useOfflineQueue } from '@stores/offlineQueueStore';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthSession>;
  signOut: () => void;
  hasRole: (role: string) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await getSessionValue(SESSION_KEY);
    if (!raw) return null;
    const parsed=JSON.parse(raw) as AuthSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.identity || !Number.isSafeInteger(parsed.identity.id) || !Array.isArray(parsed.identity.roles)) {
      await deleteSessionValue(SESSION_KEY); return null;
    }
    return parsed;
  } catch {
    await deleteSessionValue(SESSION_KEY);
    return null;
  }
}

function resolveDefaultRoute(session: AuthSession | null): string {
  if (!session) return '/(auth)/login';
  const roles = session.identity.roles;
  if (roles.includes(Roles.DRIVER)) return '/(driver)';
  if (roles.includes(Roles.GUARDIAN)) return '/(guardian)';
  if (roles.includes(Roles.RIDER)) return '/(rider)';
  return '/(auth)/login';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const logoutInFlight = React.useRef<Promise<void> | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readStoredSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });

    const unsubscribeRefresh = onSessionRefreshed(setSession);
    const unsubscribe = onSessionExpired(() => {
      void stopTripTracking();
      useOfflineQueue.getState().pause();
      setSession(null);
    });

    return () => {
      unsubscribe();
      unsubscribeRefresh();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,

    async signIn(payload: LoginPayload) {
      await logoutInFlight.current;
      invalidateSessionRequests();
      useOfflineQueue.getState().pause();
      const next = await authApi.signIn(payload);
      await setSessionValue(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return next;
    },

    async signOut() {
      if (logoutInFlight.current) return logoutInFlight.current;
      const currentRefreshToken = session?.refreshToken;
      invalidateSessionRequests();
      setSession(null);
      useOfflineQueue.getState().pause();
      logoutInFlight.current = (async () => {
        try { await stopTripTracking(); } catch { /* credentials must still be cleared */ }
        try { await unregisterCurrentPushToken(); } catch { /* token is re-scoped on next registration */ }
        if (currentRefreshToken) {
          try { await authApi.signOut(currentRefreshToken); } catch { /* finish local logout offline */ }
        }
        await deleteSessionValue(SESSION_KEY);
      })().finally(() => { logoutInFlight.current = null; });
      return logoutInFlight.current;
    },

    hasRole(role: string) {
      return Boolean(session?.identity.roles.includes(role));
    },

    getDefaultRoute() {
      return resolveDefaultRoute(session);
    },
  } as AuthContextValue;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
