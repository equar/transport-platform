export interface AuthIdentity {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tenantId: string | null;
  status: string;
  mustChangePassword: boolean;
  roles: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  identity: AuthIdentity;
}

export interface LoginPayload {
  email: string;
  password: string;
}
