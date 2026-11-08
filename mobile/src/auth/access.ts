import type { AuthSession } from './types';

export function mobileRoleOptions(session: AuthSession | null): Array<'(driver)' | '(guardian)' | '(rider)'> {
  if (!session?.identity.tenantId) return [];
  const roles = session.identity.roles;
  const ordered = ['ROLE_DRIVER', 'ROLE_GUARDIAN', 'ROLE_RIDER'] as const;
  return ordered.flatMap((roleName) => {
    const map = {
      ROLE_DRIVER: '(driver)' as const,
      ROLE_GUARDIAN: '(guardian)' as const,
      ROLE_RIDER: '(rider)' as const,
    };
    return roles.includes(roleName) ? [map[roleName]] : [];
  });
}

export function mobileRoleGroup(session: AuthSession | null): '(driver)' | '(guardian)' | '(rider)' | null {
  const options = mobileRoleOptions(session);
  if (options.length === 0) return null;
  return options[0];
}

export function mobileDefaultRoute(session: AuthSession | null): string {
  if (!session) return '/(auth)/login';
  if (!mobileRoleGroup(session)) return '/unsupported';
  if (session.identity.mustChangePassword) return '/(auth)/change-password';
  return '/' + mobileRoleGroup(session);
}
