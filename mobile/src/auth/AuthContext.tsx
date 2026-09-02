import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { authApi, type LoginPayload } from '@api/authApi';
import { SESSION_KEY, onSessionExpired } from '@api/client';
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
    return JSON.parse(raw) as AuthSession;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readStoredSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });

    const unsubscribe = onSessionExpired(() => {
      setSession(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,

    async signIn(payload: LoginPayload) {
      const next = await authApi.signIn(payload);
      await setSessionValue(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return next;
    },

    async signOut() {
      const currentRefreshToken = session?.refreshToken;
      try {
        await unregisterCurrentPushToken();
      } catch {
        // Best-effort cleanup only.
      }
      if (currentRefreshToken) {
        try { await authApi.signOut(currentRefreshToken); } catch { /* local sign-out must still complete */ }
      }
      await deleteSessionValue(SESSION_KEY);
      useOfflineQueue.getState().clear();
      setSession(null);
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
