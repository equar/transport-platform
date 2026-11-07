import { apiClient, unwrapResponse } from '../../../shared/api/client';
import type { AuthSession, LoginPayload } from '../types';

interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tenantId: string | null;
    status: string;
    mustChangePassword: boolean;
    roles: string[];
  };
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  password: string;
}

interface ChangePasswordPayload {
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

  async restoreSession(): Promise<AuthSession> {
    const response = await apiClient.post('/v1/auth/refresh');
    const tokens = unwrapResponse<AuthTokensResponse>(response.data);
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      identity: tokens.user,
    };
  },

  async signOut() {
    await apiClient.post('/v1/auth/logout');
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await apiClient.post('/v1/auth/change-password', payload);
    const message = unwrapResponse<string>(response.data);

    return {
      message: message || 'Password updated successfully.',
    };
  },

  async requestPasswordReset(payload: ForgotPasswordPayload) {
    const response = await apiClient.post('/v1/auth/forgot-password', payload);
    const message = unwrapResponse<string>(response.data);
    return {
      email: payload.email,
      message:
        message ||
        "If an account exists for that email address, password recovery instructions will be sent.",
    };
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await apiClient.post('/v1/auth/reset-password', payload);
    const message = unwrapResponse<string>(response.data);
    return {
      message: message || "Password reset successfully.",
    };
  },
};
