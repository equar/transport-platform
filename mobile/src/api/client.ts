import axios from 'axios';
import Constants from 'expo-constants';
import { deleteSessionValue, getSessionValue, setSessionValue } from '@auth/sessionStorage';
import type { ApiResponse } from './types';

export const SESSION_KEY = 'auth_session';
export const SESSION_EXPIRED_EVENT = 'SESSION_EXPIRED';

const apiBaseUrl: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  'https://transport.bakaroo.com/api';

async function readSession() {
  try {
    const raw = await getSessionValue(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { accessToken?: string; identity?: { tenantId?: string } };
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const session = await readSession() as {
    refreshToken?: string;
  } | null;
  if (!session?.refreshToken) return null;

  const response = await axios.post(`${apiBaseUrl}/v1/auth/refresh`, {
    refreshToken: session.refreshToken,
  });
  const tokens = unwrapResponse<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresInSeconds: number;
    user: unknown;
  }>(response.data);
  await setSessionValue(
    SESSION_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      identity: tokens.user,
    }),
  );
  return tokens.accessToken;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const session = await readSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (session?.identity?.tenantId) {
    config.headers['X-Tenant-Id'] = session.identity.tenantId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const originalRequest = error?.config as
      | (typeof error.config & { _authRetry?: boolean })
      | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._authRetry &&
      !String(originalRequest.url ?? '').includes('/v1/auth/')
    ) {
      originalRequest._authRetry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const accessToken = await refreshPromise;
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Fall through and invalidate the session when refresh is rejected.
      }
    }

    if (status === 401) {
      const session = await readSession();
      if (session?.accessToken) {
        await deleteSessionValue(SESSION_KEY);
        // Notify AuthContext — use a global event emitter pattern
        sessionExpiredCallbacks.forEach((cb) => cb(status));
      }
    }
    return Promise.reject(error);
  },
);

// Lightweight event emitter for session expiry (avoids circular deps)
type SessionExpiredCallback = (status: number) => void;
const sessionExpiredCallbacks = new Set<SessionExpiredCallback>();

export function onSessionExpired(cb: SessionExpiredCallback) {
  sessionExpiredCallbacks.add(cb);
  return () => sessionExpiredCallbacks.delete(cb);
}

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message ?? 'Request failed.');
  }
  return response.data;
}
