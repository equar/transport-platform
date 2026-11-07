// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrganizationPortalRidesPage } from './OrganizationPortalRidesPage';
import { organizationPortalApi } from '../api/organizationPortalApi';
vi.mock('../api/organizationPortalApi', () => ({ organizationPortalApi: {
  getDashboard: vi.fn().mockResolvedValue(null), searchRides: vi.fn(),
} }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('allows reaching records beyond the first 25 rides', async () => {
  vi.mocked(organizationPortalApi.searchRides).mockImplementation(async (params) => ({
    items: [{ id: params?.page ? 26 : 1, rideNumber: params?.page ? 'TRIP-26' : 'TRIP-1', status: 'SCHEDULED',
      serviceType: 'GENERAL_TRANSPORT', tripType: 'ONE_WAY', scheduledDropoffAt: null, guardianName: null, organizationName: null, routeId: null,
      scheduledPickupAt: '2026-11-07T09:00:00', riderName: 'Rider', pickupAddress: 'A', dropoffAddress: 'B' }],
    page: Number(params?.page ?? 0), size: 25, totalElements: 60, totalPages: 3,
  }));
  render(<OrganizationPortalRidesPage />);
  await screen.findByText('TRIP-1');
  fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
  await screen.findByText('TRIP-26');
  await waitFor(() => expect(organizationPortalApi.searchRides).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
});
it('shows a load failure without a misleading empty-list message', async () => {
  vi.mocked(organizationPortalApi.searchRides).mockRejectedValue(new Error('network'));
  render(<OrganizationPortalRidesPage />);
  await screen.findByText('Scheduled rides could not be loaded.');
  expect(screen.queryByText('No rides match the current filter.')).toBeNull();
});
