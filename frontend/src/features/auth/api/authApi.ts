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
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  password: string;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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

  async requestPasswordReset(payload: ForgotPasswordPayload) {
    await delay(700);
    return {
      email: payload.email,
      message:
        "If an account exists for that email, password recovery instructions will be sent when backend delivery is connected.",
    };
  },

  async resetPassword(payload: ResetPasswordPayload) {
    await delay(700);

    if (!payload.token || payload.token === "expired") {
      const error = new Error("expired");
      throw error;
    }

    if (payload.token === "invalid") {
      const error = new Error("invalid");
      throw error;
    }

    return {
      message:
        "Password reset is staged successfully in the public flow. Connect the backend token service to make this live.",
    };
  },
};
