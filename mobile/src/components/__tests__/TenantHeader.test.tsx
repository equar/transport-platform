import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TenantHeader } from '../TenantHeader';
import { getCachedTenantBranding } from '@auth/sessionStorage';
jest.mock('@api/runtimeApi', () => ({ runtimeApi: { getTenantBranding: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined, refetch: jest.fn() }) }));
jest.mock('@auth/sessionStorage', () => ({ getCachedTenantBranding: jest.fn(), setCachedTenantBranding: jest.fn().mockResolvedValue(undefined) }));
it('uses the current tenant cached business name offline without leaking it to another account', async () => {
  jest.mocked(getCachedTenantBranding).mockResolvedValueOnce(JSON.stringify({ displayName: 'Cached Harbor Transit' })).mockResolvedValue(null);
  const view = render(<TenantHeader tenantId="tenant-a" variant="appHeader" />);
  await waitFor(() => expect(screen.getByText('Cached Harbor Transit')).toBeTruthy());
  view.rerender(<TenantHeader tenantId="tenant-b" variant="appHeader" />);
  expect(screen.queryByText('Cached Harbor Transit')).toBeNull();
  expect(screen.getByText('Your transport provider')).toBeTruthy();
  view.rerender(<TenantHeader tenantId={null} variant="appHeader" />);
  expect(screen.getByText('No tenant assigned')).toBeTruthy();
});

it('shows the screen title instead of the tenant name outside the home screen', async () => {
  jest.mocked(getCachedTenantBranding).mockResolvedValueOnce(JSON.stringify({ displayName: 'Cached Harbor Transit' }));
  render(<TenantHeader tenantId="tenant-a" variant="appHeader" pageTitle="My Trips" />);
  await waitFor(() => expect(screen.getByText('My Trips')).toBeTruthy());
  expect(screen.queryByText('Cached Harbor Transit')).toBeNull();
  expect(screen.getByRole('header', { name: 'My Trips' })).toBeTruthy();
});
