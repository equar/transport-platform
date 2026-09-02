import axios from 'axios';
import { env } from '../config/env';
import { AUTH_SESSION_INVALIDATED_EVENT } from '../config/storage';
import { persistAuthNotice } from '../../features/auth/utils/authNotices';
import type { ApiResponse } from './types';
import { normalizeBusinessError } from './businessError';

type ClientSession = { accessToken?: string; identity?: { tenantId?: string | null } };
let currentSession: ClientSession | null = null;

export function setApiSession(session: ClientSession | null) {
  currentSession = session;
}

function readSession() { return currentSession; }

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const response = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh`, undefined, {
    withCredentials: true,
  });
  const tokens = unwrapResponse<{
    accessToken: string;
    refreshToken: string | null;
    tokenType: string;
    expiresInSeconds: number;
    user: unknown;
  }>(response.data);
  setApiSession({ accessToken: tokens.accessToken, identity: tokens.user as { tenantId?: string | null } });
  return tokens.accessToken;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
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
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
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
        // Fall through to the canonical session-invalidated flow.
      }
    }

    const isLoginRequest = String(originalRequest?.url ?? '').includes('/v1/auth/login');
    if (status === 401 && !isLoginRequest && readSession()?.accessToken) {
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
