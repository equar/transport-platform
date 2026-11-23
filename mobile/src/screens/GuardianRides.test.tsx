import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RiderRidesPage from '../../app/(rider)/rides/index';
import GuardianRidesPage from '../../app/(guardian)/rides/index';
import { riderPortalApi } from '@api/riderPortalApi';

jest.mock('@hooks/useTripScreenVisible', () => ({ useTripScreenVisible: () => true, foregroundTripRefreshOptions: { retry: false, refetchInterval: false } }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: { searchRides: jest.fn() } }));

function renderRides(rider = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      {rider ? <RiderRidesPage /> : <GuardianRidesPage />}
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

it('shows an empty state for no rides in Upcoming and History without an error', async () => {
  jest.mocked(riderPortalApi.searchRides).mockResolvedValue({
    items: [], totalElements: 0, totalPages: 0, page: 0, size: 20,
  });
  renderRides();
  await waitFor(() => expect(screen.getByText('No ride records')).toBeTruthy());
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Load more trips' })).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  await screen.findByText('No ride records');
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
});

it('keeps actual request failures visible and allows retrying to an empty result', async () => {
  jest.mocked(riderPortalApi.searchRides).mockRejectedValueOnce(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }))
    .mockResolvedValue({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  renderRides();
  await waitFor(() => expect(screen.getByText('We couldn’t load this')).toBeTruthy());
  expect(screen.getByText(/You’re offline or the service can’t be reached/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByText('No ride records')).toBeTruthy());
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
});

it('opens an active linked rider trip directly in tracking mode', async () => {
  jest.mocked(riderPortalApi.searchRides).mockResolvedValue({ items: [{ id: 10, rideNumber: 'TRIP-10', status: 'PICKED_UP', scheduledPickupAt: '2026-11-13T12:00:00' }], totalElements: 1, totalPages: 1, page: 0, size: 20 } as never);
  renderRides();
  fireEvent.press(await screen.findByRole('button', { name: 'Track trip TRIP-10' }));
  expect(mockPush).toHaveBeenCalledWith('/(guardian)/rides/10?track=1');
});

it('uses separate server-filtered rider pages and opens tracking inside the rider portal', async () => {
  jest.mocked(riderPortalApi.searchRides).mockImplementation(async filters => ({
    items: [{ id: filters?.view === 'HISTORY' ? 2 : 1, rideNumber: filters?.view === 'HISTORY' ? 'PAST-TRIP' : 'ACTIVE-TRIP', status: filters?.view === 'HISTORY' ? 'COMPLETED' : 'PICKED_UP', scheduledPickupAt: '2026-11-22T10:00:00' }], totalElements: 1, totalPages: 1, page: 0, size: 20,
  } as never));
  renderRides(true);
  fireEvent.press(await screen.findByRole('button', { name: 'Track trip ACTIVE-TRIP' }));
  expect(mockPush).toHaveBeenCalledWith('/(rider)/rides/1?track=1');
  expect(riderPortalApi.searchRides).toHaveBeenCalledWith(expect.objectContaining({ view: 'UPCOMING', sortDirection: 'ASC' }));
  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  await screen.findByText('PAST-TRIP');
  expect(riderPortalApi.searchRides).toHaveBeenCalledWith(expect.objectContaining({ view: 'HISTORY', page: 0, sortDirection: 'DESC' }));
  expect(screen.queryByRole('button', { name: 'Track trip PAST-TRIP' })).toBeNull();
});
