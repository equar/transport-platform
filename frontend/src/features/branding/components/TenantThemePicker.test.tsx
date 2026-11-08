// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TenantThemePicker } from './TenantThemePicker';
import { brandingApi, type TenantThemeState } from '../api/brandingApi';
vi.mock('../api/brandingApi', () => ({ brandingApi: { get: vi.fn(), apply: vi.fn() } }));
const state: TenantThemeState = { tenantId: 'tenant-a', companyName: 'Acme Transit', selectedCode: 'DEFAULT', eligible: true, eligibilityMessage: null,
  themes: [{ code: 'DEFAULT', name: 'Classic Blue', description: 'Default look', primaryColor: '#214e82', secondaryColor: '#12263e', accentColor: '#d8662a' },
    { code: 'FOREST', name: 'Forest Green', description: 'Green look', primaryColor: '#276442', secondaryColor: '#173c2b', accentColor: '#8b641c' }] };
beforeEach(() => { vi.mocked(brandingApi.get).mockResolvedValue(state); vi.mocked(brandingApi.apply).mockResolvedValue({ ...state, selectedCode: 'FOREST' }); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('previews without saving and applies the chosen palette to the specified tenant', async () => {
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(<TenantThemePicker tenantId="tenant-a" onApplied={refresh} />);
  fireEvent.click(await screen.findByRole('radio', { name: 'Forest Green' }));
  expect(brandingApi.apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Apply selected theme' }));
  await waitFor(() => expect(brandingApi.apply).toHaveBeenCalledWith('FOREST', 'tenant-a'));
  await screen.findByText('Theme applied to Acme Transit.');
  expect(refresh).toHaveBeenCalled();
});
it('keeps apply locked before verification', async () => {
  vi.mocked(brandingApi.get).mockResolvedValue({ ...state, eligible: false, eligibilityMessage: 'Verification required.' });
  render(<TenantThemePicker />);
  fireEvent.click(await screen.findByRole('radio', { name: 'Forest Green' }));
  expect((screen.getByRole('button', { name: 'Apply selected theme' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Verification required.')).toBeTruthy();
});
it('allows explicitly returning a branded tenant to the default', async () => {
  vi.mocked(brandingApi.get).mockResolvedValue({ ...state, selectedCode: 'FOREST' });
  render(<TenantThemePicker />);
  fireEvent.click(await screen.findByRole('radio', { name: 'Classic Blue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply selected theme' }));
  await waitFor(() => expect(brandingApi.apply).toHaveBeenCalledWith('DEFAULT', undefined));
});
