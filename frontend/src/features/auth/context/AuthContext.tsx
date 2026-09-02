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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi.restoreSession().then((restored) => {
      setApiSession(restored);
      setSession(restored);
    }).catch(() => {
      setApiSession(null);
      setSession(null);
    }).finally(() => setIsLoading(false));

    const handleSessionInvalidated = () => {
      setApiSession(null);
      setSession(null);
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
      const nextSession = await authApi.signIn(payload);
      setApiSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    signOut() {
      void authApi.signOut().catch(() => undefined);
      setApiSession(null);
      setSession(null);
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
