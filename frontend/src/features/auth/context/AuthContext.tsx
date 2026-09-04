import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { authApi } from "../api/authApi";
import {
  getDefaultRoute as resolveDefaultRoute,
  hasRole as sessionHasRole,
} from "../access";
import type { AuthSession, LoginPayload } from "../types";
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_SESSION_INVALIDATED_EVENT,
} from "../../../shared/config/storage";
import { setApiSession } from "../../../shared/api/client";

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

function persistSession(session: AuthSession | null) {
  try {
    if (session === null) {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors to avoid breaking authentication flow.
  }
}

function readPersistedSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed?.accessToken === "string" &&
      parsed.accessToken.length > 0 &&
      typeof parsed?.tokenType === "string" &&
      typeof parsed?.expiresInSeconds === "number" &&
      parsed.identity &&
      typeof parsed.identity.email === "string"
    ) {
      return parsed as AuthSession;
    }
  } catch {
    // Ignore malformed storage and continue with server-side refresh.
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const persistedSession = readPersistedSession();
    if (persistedSession) {
      setApiSession(persistedSession);
      setSession(persistedSession);
    }

    authApi.restoreSession().then((restored) => {
      setApiSession(restored);
      setSession(restored);
      persistSession(restored);
    }).catch(() => {
      if (!persistedSession) {
        setApiSession(null);
        setSession(null);
        persistSession(null);
      }
    }).finally(() => setIsLoading(false));

    const handleSessionInvalidated = () => {
      setApiSession(null);
      setSession(null);
      persistSession(null);
    };

    window.addEventListener(
      AUTH_SESSION_INVALIDATED_EVENT,
      handleSessionInvalidated,
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_INVALIDATED_EVENT,
        handleSessionInvalidated,
      );
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,
    async signIn(payload: LoginPayload) {
      setApiSession(null);
      setSession(null);
      persistSession(null);
      const nextSession = await authApi.signIn(payload);
      setApiSession(nextSession);
      setSession(nextSession);
      persistSession(nextSession);
      return nextSession;
    },
    signOut() {
      void authApi.signOut().catch(() => undefined);
      setApiSession(null);
      setSession(null);
      persistSession(null);
    },
    hasRole(role: string) {
      return sessionHasRole(session, role);
    },
    getDefaultRoute() {
      return resolveDefaultRoute(session);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
