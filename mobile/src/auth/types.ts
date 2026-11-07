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

export const Roles = {
  DRIVER: 'ROLE_DRIVER',
  RIDER: 'ROLE_RIDER',
  GUARDIAN: 'ROLE_GUARDIAN',
  TENANT_ADMIN: 'ROLE_TENANT_ADMIN',
  PLATFORM_ADMIN: 'ROLE_PLATFORM_ADMIN',
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];
