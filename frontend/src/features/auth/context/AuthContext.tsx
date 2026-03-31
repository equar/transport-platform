import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { authApi } from "../api/authApi";
import { getDefaultRoute as resolveDefaultRoute } from "../access";
import type { AuthSession, LoginPayload } from "../types";
import { AUTH_SESSION_STORAGE_KEY } from "../../../shared/config/storage";

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

function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,
    async signIn(payload: LoginPayload) {
      const nextSession = await authApi.signIn(payload);
      window.localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(nextSession),
      );
      setSession(nextSession);
      return nextSession;
    },
    signOut() {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      setSession(null);
    },
    hasRole(role: string) {
      return Boolean(session?.identity.roles.includes(role));
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
