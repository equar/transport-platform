import type { AuthSession } from './types';
export function mobileRoleGroup(session: AuthSession | null): '(driver)' | '(guardian)' | '(rider)' | null {
  if (!session?.identity.tenantId) return null;
  const roles = session.identity.roles;
  if (roles.includes('ROLE_DRIVER')) return '(driver)';
  if (roles.includes('ROLE_GUARDIAN')) return '(guardian)';
  if (roles.includes('ROLE_RIDER')) return '(rider)';
  return null;
}
export function mobileDefaultRoute(session: AuthSession | null): string {
  if (!session || !mobileRoleGroup(session)) return '/(auth)/login';
  if (session.identity.mustChangePassword) return '/(auth)/change-password';
  return '/' + mobileRoleGroup(session);
}
