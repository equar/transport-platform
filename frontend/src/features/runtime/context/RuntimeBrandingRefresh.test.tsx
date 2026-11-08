// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { RuntimeCapabilitiesProvider, useRuntimeCapabilities } from './RuntimeCapabilitiesContext';
import { runtimeApi, type RuntimeTenantCapabilities } from '../api/runtimeApi';
import type { AuthSession } from '../../auth/types';
vi.mock('../api/runtimeApi', () => ({ runtimeApi: { getTenantCapabilities: vi.fn() } }));
const session = { accessToken: 'test', identity: { id: 1, tenantId: 'tenant-a', roles: ['ROLE_TENANT_ADMIN'] } } as AuthSession;
const capabilities = { branding: { primaryColor: '#276442', displayName: 'Acme' }, operationalSettings: { timezone: 'America/New_York' }, moduleAccess: null } as unknown as RuntimeTenantCapabilities;
function Probe() { const { branding, isLoading } = useRuntimeCapabilities(); return <div>{branding?.primaryColor}|{isLoading ? 'loading' : 'ready'}</div>; }
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('retains branding during a transient background failure without entering a loading screen', async () => {
  vi.mocked(runtimeApi.getTenantCapabilities).mockResolvedValueOnce(capabilities).mockRejectedValueOnce(new AxiosError('Offline', 'ERR_NETWORK'));
  render(<RuntimeCapabilitiesProvider session={session}><Probe /></RuntimeCapabilitiesProvider>);
  await screen.findByText('#276442|ready');
  window.dispatchEvent(new Event('focus'));
  await waitFor(() => expect(runtimeApi.getTenantCapabilities).toHaveBeenCalledTimes(2));
  expect(screen.getByText('#276442|ready')).toBeTruthy();
});
it('clears tenant capabilities on a background access denial', async () => {
  vi.mocked(runtimeApi.getTenantCapabilities).mockResolvedValueOnce(capabilities)
    .mockRejectedValueOnce(Object.assign(new AxiosError('Forbidden'), { response: { status: 403 } }));
  render(<RuntimeCapabilitiesProvider session={session}><Probe /></RuntimeCapabilitiesProvider>);
  await screen.findByText('#276442|ready');
  window.dispatchEvent(new Event('focus'));
  await screen.findByText('#214e82|ready');
});
