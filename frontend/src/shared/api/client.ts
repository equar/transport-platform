import axios from 'axios';
import { env } from '../config/env';
import { AUTH_SESSION_INVALIDATED_EVENT } from '../config/storage';
import { persistAuthNotice } from '../../features/auth/utils/authNotices';
import type { ApiResponse } from './types';
import { normalizeBusinessError } from './businessError';
import { logClientEvent } from '../observability/clientTelemetry';
import {
  buildCorrelationId,
  getCorrelationHeaderName,
} from '../observability/correlationId';

type ClientSession = { accessToken?: string; identity?: { id?: number; tenantId?: string | null; roles?: string[]; mustChangePassword?: boolean } };
let currentSession: ClientSession | null = null;
let sessionGeneration = 0;
export const SESSION_REFRESHED_EVENT = "transport.session-refreshed";

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const MAX_RETRY_ATTEMPTS = 2;

function sessionScope(session: ClientSession | null) {
  return JSON.stringify([session?.identity?.tenantId, session?.identity?.id,
    session?.identity?.roles?.slice().sort(), session?.identity?.mustChangePassword]);
}
export function setApiSession(session: ClientSession | null) {
  if (!session || !currentSession || sessionScope(session) !== sessionScope(currentSession)) sessionGeneration++;
  currentSession = session;
}

function readSession() { return currentSession; }

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const generation = sessionGeneration;
  const response = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh`, undefined, {
    withCredentials: true,
    timeout: 10000,
  });
  const tokens = unwrapResponse<{
    accessToken: string;
    refreshToken: string | null;
    tokenType: string;
    expiresInSeconds: number;
    user: unknown;
  }>(response.data);
  if (generation !== sessionGeneration) return null;
  setApiSession({ accessToken: tokens.accessToken, identity: tokens.user as { tenantId?: string | null; roles?: string[]; mustChangePassword?: boolean } });
  window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT, { detail: {
    accessToken: tokens.accessToken, tokenType: tokens.tokenType, expiresInSeconds: tokens.expiresInSeconds, identity: tokens.user,
  } }));
  return tokens.accessToken;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

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
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

apiClient.interceptors.request.use((config) => {
  // Let the browser supply the multipart boundary instead of serializing files as JSON.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  const request = config as typeof config & { _sessionGeneration?: number };
  request._sessionGeneration ??= sessionGeneration;
  if (request._sessionGeneration !== sessionGeneration) throw new axios.CanceledError('The account changed.');
  const correlationHeaderName = getCorrelationHeaderName();
  if (!config.headers[correlationHeaderName]) {
    config.headers[correlationHeaderName] = buildCorrelationId();
  }

  const requestUrl = String(config.url ?? '');
  const isPublicLoginRequest = requestUrl.includes('/v1/auth/login');
  if (isPublicLoginRequest) {
    delete config.headers.Authorization;
    delete config.headers['X-Tenant-Id'];
    return config;
  }

  const session = readSession();
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
    const status = error?.response?.status;
    const originalRequest = error?.config as
      | (typeof error.config & { _authRetry?: boolean; _retryAttempt?: number; _sessionGeneration?: number })
      | undefined;
    if (axios.isCancel(error) || (originalRequest && originalRequest._sessionGeneration !== sessionGeneration)) return Promise.reject(error);

    if (originalRequest && shouldRetryTransientError(status, originalRequest.method)) {
      const retryAttempt = originalRequest._retryAttempt ?? 0;
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        originalRequest._retryAttempt = retryAttempt + 1;
        await delay(backoffDelayMs(retryAttempt));
        return apiClient(originalRequest);
      }

      logClientEvent('warn', 'api.retry.exhausted', {
        method: originalRequest.method,
        path: String(originalRequest.url ?? ''),
        status,
        attempts: retryAttempt,
        correlationId:
          originalRequest.headers?.[getCorrelationHeaderName()] ??
          error?.response?.headers?.[getCorrelationHeaderName().toLowerCase()],
      });
    }

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
        // Fall through to the canonical session-invalidated flow.
      }
    }

    if (originalRequest && originalRequest._sessionGeneration !== sessionGeneration) return Promise.reject(new axios.CanceledError('The account changed.'));

    const isLoginRequest = String(originalRequest?.url ?? '').includes('/v1/auth/login');
    if (status === 401 && !isLoginRequest && readSession()?.accessToken) {
      logClientEvent('warn', 'auth.session.invalidated', {
        path: String(originalRequest?.url ?? ''),
        status,
        correlationId:
          originalRequest?.headers?.[getCorrelationHeaderName()] ??
          error?.response?.headers?.[getCorrelationHeaderName().toLowerCase()],
      });
      setApiSession(null);
      persistAuthNotice({
        reason: 'session-expired',
        message: 'Your session expired or is no longer valid. Sign in again to continue.',
      });
      window.dispatchEvent(
        new CustomEvent(AUTH_SESSION_INVALIDATED_EVENT, {
          detail: { status },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message ?? 'Request failed.');
  }

  return response.data;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return normalizeBusinessError(error, fallback).message;
}
