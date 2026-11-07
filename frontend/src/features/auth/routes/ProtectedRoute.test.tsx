import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import type { AuthSession } from '../types';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock('../context/AuthContext', () => ({ useAuth }));
vi.mock('../../runtime/context/RuntimeCapabilitiesContext', () => ({
  useRuntimeCapabilities: () => ({ isLoading: false, moduleAccess: null }),
}));

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function session(roles: string[], tenantId: string | null = 'tenant-123'): AuthSession {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresInSeconds: 900,
    identity: {
      id: 1,
      email: 'user@example.com',
      firstName: 'Taylor',
      lastName: 'Morgan',
      tenantId,
      status: 'ACTIVE',
      mustChangePassword: false,
      roles,
    },
  };
}

function renderAt(pathname: string) {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route
          path="/platform/*"
          element={(
            <>
              <ProtectedRoute>
                <div>Protected workspace</div>
              </ProtectedRoute>
              <LocationProbe />
            </>
          )}
        />
        <Route
          path="/company/*"
          element={(
            <>
              <ProtectedRoute>
                <div>Protected workspace</div>
              </ProtectedRoute>
              <LocationProbe />
            </>
          )}
        />
        <Route
          path="/portal/driver/*"
          element={(
            <>
              <ProtectedRoute>
                <div>Protected workspace</div>
              </ProtectedRoute>
              <LocationProbe />
            </>
          )}
        />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute role boundaries', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useAuth.mockReset();
  });

  it('redirects a platform administrator away from the company workspace', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: () => true,
      session: session(['ROLE_PLATFORM_ADMIN'], null),
    });

    renderAt('/company/users');

    expect(screen.getByTestId('location').textContent).toBe('/platform');
  });

  it('redirects a tenant administrator away from the platform workspace', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: () => true,
      session: session(['ROLE_TENANT_ADMIN']),
    });

    renderAt('/platform/users');

    expect(screen.getByTestId('location').textContent).toBe('/company');
  });

  it('redirects a driver away from administrative workspaces', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: () => true,
      session: session(['ROLE_DRIVER']),
    });

    renderAt('/company/drivers');

    expect(screen.getByTestId('location').textContent).toBe('/portal/driver');
  });

  it('allows a driver into the driver portal', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === 'ROLE_DRIVER',
      session: session(['ROLE_DRIVER']),
    });

    renderAt('/portal/driver/profile');

    expect(screen.getByTestId('location').textContent).toBe('/portal/driver/profile');
    expect(screen.getByText('Protected workspace')).not.toBeNull();
  });
});