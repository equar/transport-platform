import axios from 'axios';
import { env } from '../config/env';
import {
  AUTH_SESSION_INVALIDATED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
} from '../config/storage';
import { persistAuthNotice } from '../../features/auth/utils/authNotices';
import type { ApiResponse } from './types';
import { normalizeBusinessError } from './businessError';

function readSession() {
  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { accessToken?: string; identity?: { tenantId?: string } };
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const session = readSession() as {
    refreshToken?: string;
    identity?: unknown;
  } | null;
  if (!session?.refreshToken) return null;

  const response = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh`, {
    refreshToken: session.refreshToken,
  });
  const tokens = unwrapResponse<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresInSeconds: number;
    user: unknown;
  }>(response.data);
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
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
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
