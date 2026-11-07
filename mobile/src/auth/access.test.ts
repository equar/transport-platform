import { mobileDefaultRoute, mobileRoleGroup } from './access';
import type { AuthSession } from './types';
function session(role: string, mustChangePassword = false): AuthSession {
  return { identity: { tenantId: 'tenant-a', roles: [role], mustChangePassword } } as AuthSession;
}
it('does not treat platform or tenant administrators as mobile portal identities', () => {
  expect(mobileRoleGroup(session('ROLE_PLATFORM_ADMIN'))).toBeNull();
  expect(mobileRoleGroup(session('ROLE_TENANT_ADMIN'))).toBeNull();
  expect(mobileRoleGroup({ ...session('ROLE_DRIVER'), identity: { ...session('ROLE_DRIVER').identity, tenantId: null } })).toBeNull();
});
it('requires password replacement before entering a portal', () => {
  expect(mobileDefaultRoute(session('ROLE_DRIVER', true))).toBe('/(auth)/change-password');
  expect(mobileDefaultRoute(session('ROLE_DRIVER'))).toBe('/(driver)');
  expect(mobileDefaultRoute(session('ROLE_GUARDIAN'))).toBe('/(guardian)');
});
