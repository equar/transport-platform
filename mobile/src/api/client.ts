import axios from 'axios';
import Constants from 'expo-constants';
import type { ApiResponse } from './types';
import type { AuthSession } from '@auth/types';
import { deleteSessionValue, getSessionValue, setSessionValue } from '@auth/sessionStorage';
import { logClientEvent } from '@utils/clientTelemetry';
import { buildCorrelationId, getCorrelationHeaderName } from '@utils/correlationId';

export const SESSION_KEY = 'auth_session';
export const SESSION_EXPIRED_EVENT = 'SESSION_EXPIRED';

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const MAX_RETRY_ATTEMPTS = 2;

function normalizeApiBaseUrl(rawValue: string | undefined) {
  const fallback = 'https://transport.bakaroo.com/api';
  const resolved = (rawValue ?? fallback).trim();
  const normalized = resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
  const isDevelopmentBuild = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

  const url = new URL(normalized);
  if (url.protocol !== 'https:') {
    if (!isDevelopmentBuild) {
      throw new Error(`Production mobile builds must use HTTPS. Received: ${normalized}`);
    }
    return fallback;
  }

  if (!isDevelopmentBuild && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '10.0.2.2')) {
    throw new Error(`Production mobile builds cannot target a local API host: ${normalized}`);
  }

  return normalized;
}

const apiBaseUrl: string = normalizeApiBaseUrl(
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl,
);

function shouldRetryTransientError(status: number | undefined, method: string | undefined) {
  const normalizedMethod = (method ?? 'get').toLowerCase();
  if (!RETRYABLE_METHODS.has(normalizedMethod)) {
    return false;
  }
  if (!status) {
    return true;
  }
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function backoffDelayMs(attempt: number) {
  const jitter = Math.floor(Math.random() * 80);
  return 200 * Math.pow(2, attempt) + jitter;
}

async function delay(ms: number) {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

async function readSession() {
  try {
    const raw = await getSessionValue(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    logClientEvent('warn', 'auth.refresh.failed', {
      path: '/v1/auth/refresh',
    });
    return null;
  }
}

let sessionGeneration = 0;
export function invalidateSessionRequests() { sessionGeneration++; }
async function writeSession(session: AuthSession) {
  await setSessionValue(SESSION_KEY, JSON.stringify(session));
}

let refreshPromise: Promise<AuthSession | null> | null = null;

async function refreshAccessToken() {
  const generation = sessionGeneration;
  const session = await readSession();
  if (!session?.refreshToken) return null;

  try {
    const response = await axios.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      expiresInSeconds: number;
      user: AuthSession['identity'];
    }>>(`${apiBaseUrl}/v1/auth/refresh`, {
      refreshToken: session.refreshToken,
    }, {
      timeout: 10_000,
      headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'mobile' },
    });

    if (!response.data.success || !response.data.data) {
      return null;
    }

    const tokens = response.data.data;
    const refreshed: AuthSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      identity: tokens.user,
    };
    if (generation !== sessionGeneration) return null;
    await writeSession(refreshed);
    if (generation !== sessionGeneration) return null;
    sessionRefreshedCallbacks.forEach(callback => callback(refreshed));
    return refreshed;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const request = config as typeof config & { _sessionGeneration?: number };
  request._sessionGeneration ??= sessionGeneration;
  if (request._sessionGeneration !== sessionGeneration) throw new axios.CanceledError('The account changed.');
  const correlationHeaderName = getCorrelationHeaderName();
  if (!config.headers[correlationHeaderName]) {
    config.headers[correlationHeaderName] = buildCorrelationId();
  }
  config.headers['X-Client-Platform'] = 'mobile';
  if (['/v1/auth/login', '/v1/auth/forgot-password', '/v1/auth/reset-password'].some(path => String(config.url ?? '').includes(path))) {
    delete config.headers.Authorization; delete config.headers['X-Tenant-Id']; return config;
  }
  const session = await readSession();
  if (request._sessionGeneration !== sessionGeneration) throw new axios.CanceledError('The account changed.');
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (session?.identity?.tenantId) {
    config.headers['X-Tenant-Id'] = session.identity.tenantId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if ((response.config as typeof response.config & { _sessionGeneration?: number })._sessionGeneration !== sessionGeneration) {
      throw new axios.CanceledError('The account changed.');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config as
      | ({ _retry?: boolean; _retryAttempt?: number; _sessionGeneration?: number; headers?: Record<string, string> } & Record<string, unknown>)
      | undefined;
    const status = error?.response?.status as number | undefined;
    if (axios.isCancel(error) || (originalRequest && originalRequest._sessionGeneration !== sessionGeneration)) return Promise.reject(error);

    if (originalRequest && shouldRetryTransientError(status, String(originalRequest.method ?? 'get'))) {
      const retryAttempt = originalRequest._retryAttempt ?? 0;
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        originalRequest._retryAttempt = retryAttempt + 1;
        await delay(backoffDelayMs(retryAttempt));
        return apiClient.request(originalRequest);
      }

      logClientEvent('warn', 'api.retry.exhausted', {
        method: String(originalRequest.method ?? 'get'),
        path: String(originalRequest.url ?? ''),
        status,
        attempts: retryAttempt,
        correlationId:
          originalRequest.headers?.[getCorrelationHeaderName()] ??
          error?.response?.headers?.[getCorrelationHeaderName().toLowerCase()],
      });
    }

    if (status === 401 && originalRequest && !originalRequest._retry
        && !String(originalRequest.url ?? '').includes('/v1/auth/')) {
      originalRequest._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const refreshedSession = await refreshPromise;
      if (refreshedSession?.accessToken) {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshedSession.accessToken}`,
        };
        if (refreshedSession.identity.tenantId) {
          originalRequest.headers['X-Tenant-Id'] = refreshedSession.identity.tenantId;
        }
        return apiClient.request(originalRequest);
      }
    }

    if (originalRequest && originalRequest._sessionGeneration !== sessionGeneration) return Promise.reject(new axios.CanceledError('The account changed.'));
    if (status === 401) {
      const session = await readSession();
      if (originalRequest && originalRequest._sessionGeneration !== sessionGeneration) return Promise.reject(new axios.CanceledError('The account changed.'));
      if (session?.accessToken) {
        logClientEvent('warn', 'auth.session.invalidated', {
          path: String(originalRequest?.url ?? ''),
          status,
          correlationId:
            originalRequest?.headers?.[getCorrelationHeaderName()] ??
            error?.response?.headers?.[getCorrelationHeaderName().toLowerCase()],
        });
        invalidateSessionRequests();
        await deleteSessionValue(SESSION_KEY);
        sessionExpiredCallbacks.forEach((cb) => cb(status));
      }
    }

    const apiError = error?.response?.data?.error;
    if (apiError?.message) error.message = apiError.message;
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

const sessionRefreshedCallbacks = new Set<(session: AuthSession) => void>();
export function onSessionRefreshed(callback: (session: AuthSession) => void) {
  sessionRefreshedCallbacks.add(callback); return () => sessionRefreshedCallbacks.delete(callback);
}
