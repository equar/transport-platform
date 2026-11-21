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

it('routes signed-in web-only roles to a sign-out-capable support screen', () => {
  expect(mobileDefaultRoute(session('ROLE_TENANT_ADMIN'))).toBe('/unsupported');
  expect(mobileDefaultRoute(session('ROLE_VIEWER'))).toBe('/unsupported');
  expect(mobileDefaultRoute(null)).toBe('/(auth)/login');
});

it('fails closed for ambiguous operational roles instead of mixing portals', () => {
  const mixed = session('ROLE_DRIVER');
  mixed.identity.roles.push('ROLE_GUARDIAN');
  expect(mobileRoleGroup(mixed)).toBeNull();
  expect(mobileDefaultRoute(mixed)).toBe('/unsupported');
});
it('rejects malformed stored identities without crashing', () => {
  expect(mobileRoleGroup({ identity: null } as unknown as AuthSession)).toBeNull();
  expect(mobileRoleGroup({ identity: { tenantId: 'a', roles: [null] } } as unknown as AuthSession)).toBeNull();
});
