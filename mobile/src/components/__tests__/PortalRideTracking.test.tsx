import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RiderRideDetailPage from '../../../app/(rider)/rides/[rideId]';
import GuardianRideDetailPage from '../../../app/(guardian)/rides/[rideId]';
import { riderPortalApi } from '@api/riderPortalApi';

jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ rideId: '10' }), useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock('@components/SupportContact', () => ({ SupportContact: () => null }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: { getRide: jest.fn(), getRideLocationSnapshot: jest.fn() } }));
const clients: QueryClient[] = [];
beforeEach(() => jest.clearAllMocks());
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

it.each([
  ['rider', RiderRideDetailPage, 'COMPLETED', false],
  ['guardian', GuardianRideDetailPage, 'COMPLETED', false],
  ['rider', RiderRideDetailPage, 'CANCELLED', false],
  ['guardian', GuardianRideDetailPage, 'DROPPED_OFF', false],
  ['rider', RiderRideDetailPage, 'PICKED_UP', true],
  ['guardian', GuardianRideDetailPage, 'DRIVER_EN_ROUTE', true],
] as const)('%s tracking matches the %s trip lifecycle', async (_role, Page, status, active) => {
  jest.mocked(riderPortalApi.getRide).mockResolvedValue({ id: 10, rideNumber: 'TRIP-10', status, scheduledPickupAt: '2026-11-13T12:00:00', pickupAddress: 'Pickup', dropoffAddress: 'Destination' } as never);
  jest.mocked(riderPortalApi.getRideLocationSnapshot).mockResolvedValue(null);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
  await screen.findByText('TRIP-10');
  if (active) {
    expect(screen.getByRole('button', { name: 'Refresh Tracking' })).toBeTruthy();
    await waitFor(() => expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledWith(10));
  } else {
    expect(screen.queryByRole('button', { name: 'Refresh Tracking' })).toBeNull();
    expect(screen.queryByText(/Location appears during an active trip/)).toBeNull();
    expect(riderPortalApi.getRideLocationSnapshot).not.toHaveBeenCalled();
  }
});
