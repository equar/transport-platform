import axios from 'axios';
import { env } from '../config/env';
import {
  AUTH_SESSION_INVALIDATED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
} from '../config/storage';
import { persistAuthNotice } from '../../features/auth/utils/authNotices';
import type { ApiResponse } from './types';

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

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
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
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && readSession()?.accessToken) {
      persistAuthNotice({
        reason: status === 401 ? 'session-expired' : 'invalid-access',
        message:
          status === 401
            ? 'Your session expired or is no longer valid. Sign in again to continue.'
            : 'Your access changed or the requested operation is no longer available for this account. Sign in again to continue.',
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
