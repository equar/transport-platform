import { describe, expect, it } from 'vitest';
import { canAccessScope, getDefaultRoute, isMobileOnlyAccount, resolvePostLoginRoute } from './access';
import type { AuthSession } from './types';
describe('unsupported web roles', () => {
  it.each(['ROLE_DRIVER', 'ROLE_RIDER', 'ROLE_GUARDIAN', 'DRIVER', 'RIDER', 'GUARDIAN'])(
    'denies every web workspace for %s, including mixed-role accounts',
    role => {
      for (const roles of [[role], [role, 'ROLE_TENANT_ADMIN']]) {
        const session = {identity: {tenantId:'tenant', roles, mustChangePassword:true}} as AuthSession;
        expect(isMobileOnlyAccount(session)).toBe(true);
        expect(getDefaultRoute(session)).toBe('/unauthorized');
        for (const scope of ['driver','rider','company','platform','organization'] as const) {
          expect(canAccessScope(session,scope)).toBe(false);
        }
        expect(resolvePostLoginRoute(session, '/portal/rider/rides')).toBe('/unauthorized');
      }
    },
  );
  it('does not send an authenticated viewer back into login', () => {
    const session = { identity: { tenantId: 'tenant', roles: ['ROLE_VIEWER'], mustChangePassword: false } } as AuthSession;
    expect(getDefaultRoute(session)).toBe('/unauthorized');
    expect(getDefaultRoute(null)).toBe('/login');
  });
});
