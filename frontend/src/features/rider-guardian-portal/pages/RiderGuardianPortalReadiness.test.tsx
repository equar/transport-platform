import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RiderGuardianPortalRideDetailsPage } from './RiderGuardianPortalRideDetailsPage';
import { RiderGuardianPortalRidesPage } from './RiderGuardianPortalRidesPage';
import { isHistoryRide } from './RiderGuardianPortalRideHistoryPage';
import { riderGuardianPortalApi, type RiderGuardianPortalRideRecord } from '../api/riderGuardianPortalApi';
vi.mock('../api/riderGuardianPortalApi', () => ({ riderGuardianPortalApi: { getRide: vi.fn(), getDashboard: vi.fn(), getLinkedRiders: vi.fn(), searchRides: vi.fn() } }));
const ride = { id: 10, rideNumber: 'TRIP-10', status: 'ASSIGNED', riderName: 'Sample Rider', scheduledPickupAt: '2026-11-10T09:00:00', scheduledDropoffAt: '2026-11-10T10:00:00', pickupAddress: 'Pickup', dropoffAddress: 'Destination', serviceType: 'GENERAL_TRANSPORT', tripType: 'ONE_WAY', organizationName: null, guardianName: null, routeId: null, recurrenceScheduleId: null, recurringRide: false };
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
async function renderDetail(id = '10') {
  await act(async () => { render(<MemoryRouter initialEntries={[`/portal/rider/rides/${id}`]}><Routes><Route path="/portal/rider/rides/:rideId" element={<RiderGuardianPortalRideDetailsPage />} /></Routes></MemoryRouter>); });
}
it('refreshes an in-progress trip without a page reload', async () => {
  vi.mocked(riderGuardianPortalApi.getRide).mockResolvedValueOnce(ride as never).mockResolvedValue({ ...ride, pickupAddress: 'Updated pickup', status: 'PICKED_UP' } as never);
  await renderDetail();
  expect(screen.getByText('Ride TRIP-10')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(screen.getByText('Pickup address: Updated pickup')).toBeTruthy();
  expect(riderGuardianPortalApi.getRide).toHaveBeenCalledTimes(2);
});
it('clears cached trip details when access is revoked during a refresh', async () => {
  vi.mocked(riderGuardianPortalApi.getRide).mockResolvedValueOnce(ride as never).mockRejectedValue(new Error('Access revoked'));
  await renderDetail();
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(screen.queryByText('Ride TRIP-10')).toBeNull();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
});
it('shows a usable error for an invalid trip URL instead of loading forever', async () => {
  await renderDetail('invalid');
  expect(screen.getByText('Choose a valid trip from your trip list.')).toBeTruthy();
  expect(riderGuardianPortalApi.getRide).not.toHaveBeenCalled();
});
it('keeps delayed active trips out of history and includes all finished outcomes', () => {
  for (const status of ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP']) expect(isHistoryRide({ ...ride, status, scheduledPickupAt: '2020-01-01T09:00:00' } as RiderGuardianPortalRideRecord)).toBe(false);
  for (const status of ['DROPPED_OFF', 'COMPLETED', 'CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW']) expect(isHistoryRide({ ...ride, status } as RiderGuardianPortalRideRecord)).toBe(true);
});

it('lets riders and guardians load trips beyond the first page', async () => {
  vi.mocked(riderGuardianPortalApi.getDashboard).mockResolvedValue({ upcomingRideCount: 2, activeRideCount: 1, linkedRiderCount: 1 } as never);
  vi.mocked(riderGuardianPortalApi.getLinkedRiders).mockResolvedValue([]);
  vi.mocked(riderGuardianPortalApi.searchRides).mockResolvedValue({ items: [], totalElements: 75, totalPages: 3, page: 0, size: 25 });
  await act(async () => { render(<MemoryRouter><RiderGuardianPortalRidesPage /></MemoryRouter>); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' })); });
  expect(riderGuardianPortalApi.searchRides).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
});
