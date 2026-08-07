import { apiClient, unwrapResponse } from './client';
import type { AuthSession } from '@auth/types';

interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tenantId: string | null;
    status: string;
    roles: string[];
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  async signIn(payload: LoginPayload): Promise<AuthSession> {
    const response = await apiClient.post('/v1/auth/login', payload);
    const tokens = unwrapResponse<AuthTokensResponse>(response.data);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      identity: tokens.user,
    };
  },

  async refreshToken(token: string): Promise<AuthSession> {
    const response = await apiClient.post('/v1/auth/refresh', { refreshToken: token });
    const tokens = unwrapResponse<AuthTokensResponse>(response.data);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      identity: tokens.user,
    };
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await apiClient.post('/v1/auth/change-password', payload);
    return unwrapResponse<string>(response.data);
  },
};
