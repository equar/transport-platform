import { describe, expect, it } from 'vitest';
import { getDefaultRoute } from './access';
import type { AuthSession } from './types';
describe('unsupported web roles', () => {
  it('does not send an authenticated viewer back into login', () => {
    const session = { identity: { tenantId: 'tenant', roles: ['ROLE_VIEWER'], mustChangePassword: false } } as AuthSession;
    expect(getDefaultRoute(session)).toBe('/unauthorized');
    expect(getDefaultRoute(null)).toBe('/login');
  });
});
