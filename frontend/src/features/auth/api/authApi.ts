import { apiClient, unwrapResponse } from '../../../shared/api/client';
import type { AuthSession, LoginPayload } from '../types';

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

interface ForgotPasswordPayload {
  tenantId: string;
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

function resolveApiErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as {
      response?: { data?: { error?: { message?: string } } };
    }).response?.data?.error?.message === 'string'
  ) {
    return ((error as {
      response?: { data?: { error?: { message?: string } } };
    }).response?.data?.error?.message ?? 'Request failed.');
  }

  return error instanceof Error ? error.message : 'Request failed.';
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
        'If an account exists for that workspace and email, password recovery instructions will be prepared for delivery.',
    };
  },

  async resetPassword(payload: ResetPasswordPayload) {
    try {
      const response = await apiClient.post('/v1/auth/reset-password', payload);
      const message = unwrapResponse<string>(response.data);

      return {
        message:
          message ||
          'The password reset request completed successfully. You can now sign in with your new password.',
      };
    } catch (error) {
      const message = resolveApiErrorMessage(error);
      if (message.includes('expired')) {
        throw new Error('expired');
      }
      if (message.includes('invalid')) {
        throw new Error('invalid');
      }
      throw new Error(message);
    }
  },
};
