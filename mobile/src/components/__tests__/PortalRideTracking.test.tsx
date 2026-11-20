jest.mock('@components/TripDeliveryEvidence', () => ({TripDeliveryEvidence: () => null}));
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RiderRideDetailPage from '../../../app/(rider)/rides/[rideId]';
import GuardianRideDetailPage from '../../../app/(guardian)/rides/[rideId]';
import { Marker, Polyline } from 'react-native-maps';
import { riderPortalApi } from '@api/riderPortalApi';

let mockVisible = true;
jest.mock('@hooks/useTripScreenVisible', () => ({ useTripScreenVisible: () => mockVisible, manualTripRefreshOptions: { refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false } }));
let mockParams: { rideId: string; track?: string } = { rideId: '10' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock('@components/SupportContact', () => ({ SupportContact: () => null }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: { getRide: jest.fn(), getRideLocationHistory: jest.fn().mockResolvedValue([]), getRideLocationSnapshot: jest.fn() } }));
const clients: QueryClient[] = [];
beforeEach(() => { jest.clearAllMocks(); jest.mocked(riderPortalApi.getRideLocationHistory).mockResolvedValue([]); mockVisible = true; mockParams = { rideId: '10' }; });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); jest.useRealTimers(); });

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
    if (_role === 'guardian') {
      expect(screen.getByRole('button', { name: 'Track' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Refresh Tracking' })).toBeNull();
      expect(riderPortalApi.getRideLocationSnapshot).not.toHaveBeenCalled();
    } else {
      expect(screen.getByRole('button', { name: 'Refresh Tracking' })).toBeTruthy();
      await waitFor(() => expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledWith(10));
    }
  } else {
    expect(screen.queryByRole('button', { name: 'Refresh Tracking' })).toBeNull();
    expect(screen.queryByText(/Location appears during an active trip/)).toBeNull();
    expect(riderPortalApi.getRideLocationSnapshot).not.toHaveBeenCalled();
  }
});

it('fetches and shows the assigned driver location map when a guardian taps Track', async () => {
  jest.mocked(riderPortalApi.getRideLocationHistory).mockResolvedValue([
    { latitude: 38.8977, longitude: -77.0365, capturedAt: '2026-11-20T00:00:30Z' },
    { latitude: 38.897, longitude: -77.036, capturedAt: '2026-11-20T00:00:00Z' },
  ] as never);
  jest.mocked(riderPortalApi.getRide).mockResolvedValue({ id: 10, rideNumber: 'TRIP-10', status: 'PICKED_UP', scheduledPickupAt: '2026-11-13T12:00:00', pickupAddress: 'Pickup', dropoffAddress: 'Destination' } as never);
  jest.mocked(riderPortalApi.getRideLocationSnapshot).mockResolvedValue({
    latitude: 38.8977,
    longitude: -77.0365,
    capturedAt: new Date().toISOString(),
  } as never);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  render(<QueryClientProvider client={client}><GuardianRideDetailPage /></QueryClientProvider>);

  await screen.findByText('TRIP-10');
  expect(riderPortalApi.getRideLocationSnapshot).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Track' }));
  expect(await screen.findByLabelText('Map showing the latest shared ride location')).toBeTruthy();
  expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledTimes(1);
  expect(await screen.findByLabelText('Rider and assigned driver')).toBeTruthy();
  await waitFor(() => expect(screen.UNSAFE_getByType(Polyline).props.coordinates).toHaveLength(2));
  expect(riderPortalApi.getRideLocationHistory).toHaveBeenCalledWith(10);
  expect(screen.queryByRole('button', { name: 'Show map' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Open in Maps' })).toBeNull();
  expect(screen.getByText(/The rider is on board/)).toBeTruthy();
});

it('refreshes only on request or returning to view, without polling, and stops after completion', async () => {
  jest.useFakeTimers(); mockParams = { rideId: '10', track: '1' };
  const ride = { id: 10, rideNumber: 'TRIP-10', status: 'PICKED_UP', scheduledPickupAt: '2026-11-13T12:00:00' };
  jest.mocked(riderPortalApi.getRide).mockResolvedValue(ride as never);
  jest.mocked(riderPortalApi.getRideLocationSnapshot)
    .mockResolvedValueOnce({ latitude: 38.9, longitude: -77, capturedAt: new Date().toISOString() } as never)
    .mockResolvedValue({ latitude: 38.91, longitude: -77.01, capturedAt: new Date().toISOString() } as never);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(client);
  const view = render(<QueryClientProvider client={client}><GuardianRideDetailPage /></QueryClientProvider>);
  await screen.findByLabelText('Rider and assigned driver');
  expect(view.UNSAFE_getByType(Marker).props.coordinate).toEqual({ latitude: 38.9, longitude: -77 });
  await act(async () => { await jest.advanceTimersByTimeAsync(90000); });
  expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledTimes(1);
  expect(riderPortalApi.getRide).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('button', { name: 'Refresh Tracking' }));
  await waitFor(() => expect(view.UNSAFE_getByType(Marker).props.coordinate).toEqual({ latitude: 38.91, longitude: -77.01 }));
  mockVisible = false;
  view.rerender(<QueryClientProvider client={client}><GuardianRideDetailPage /></QueryClientProvider>);
  const hiddenCalls = jest.mocked(riderPortalApi.getRideLocationSnapshot).mock.calls.length;
  await act(async () => { await jest.advanceTimersByTimeAsync(90000); });
  expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledTimes(hiddenCalls);
  mockVisible = true;
  view.rerender(<QueryClientProvider client={client}><GuardianRideDetailPage /></QueryClientProvider>);
  await waitFor(() => expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledTimes(hiddenCalls + 1));
  jest.mocked(riderPortalApi.getRide).mockResolvedValue({ ...ride, status: 'COMPLETED' } as never);
  fireEvent.press(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(screen.queryByTestId('ride-location-map')).toBeNull());
  const calls = jest.mocked(riderPortalApi.getRideLocationSnapshot).mock.calls.length;
  await act(async () => { await jest.advanceTimersByTimeAsync(45000); });
  expect(riderPortalApi.getRideLocationSnapshot).toHaveBeenCalledTimes(calls);
  expect(screen.queryByRole('button', { name: 'Track' })).toBeNull();
});
it('opens an embedded map without inventing a driver pin before the first GPS report', async () => {
  mockParams = { rideId: '10', track: '1' };
  jest.mocked(riderPortalApi.getRide).mockResolvedValue({ id: 10, rideNumber: 'TRIP-10', status: 'DRIVER_EN_ROUTE', scheduledPickupAt: '2026-11-13T12:00:00' } as never);
  jest.mocked(riderPortalApi.getRideLocationSnapshot).mockResolvedValue(null);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(client);
  const view = render(<QueryClientProvider client={client}><GuardianRideDetailPage /></QueryClientProvider>);
  expect(await screen.findByTestId('ride-location-map')).toBeTruthy();
  expect(view.UNSAFE_queryByType(Marker)).toBeNull();
  expect(screen.getByText(/Waiting for the driver’s first location update/)).toBeTruthy();
});
