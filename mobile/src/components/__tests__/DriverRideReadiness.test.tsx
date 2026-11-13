import React from 'react';
import { Alert } from 'react-native';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DriverRideDetailPage from '../../../app/(driver)/rides/[rideId]';
import { driverPortalApi, type DriverPortalRideDetailRecord } from '@api/driverPortalApi';
import { stopTripTracking } from '../../tracking/activeTrip';
let mockConnected = true;
let mockRide: DriverPortalRideDetailRecord;
const mockEnqueue = jest.fn();
const clients: QueryClient[] = [];
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ rideId: '10' }), useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: { identity: { id: 7, tenantId: 'tenant-a' } } }) }));
jest.mock('@components/SupportContact', () => ({ SupportContact: () => null }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn().mockResolvedValue(undefined), NotificationFeedbackType: { Success: 'success', Warning: 'warning' } }));
jest.mock('expo-linking', () => ({ openURL: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: { fetch: async () => ({ isConnected: mockConnected, isInternetReachable: mockConnected }) }, useNetInfo: () => ({ isConnected: mockConnected, isInternetReachable: mockConnected }) }));
jest.mock('../../tracking/activeTrip', () => ({ startTripTracking: jest.fn().mockResolvedValue(undefined), stopTripTracking: jest.fn().mockResolvedValue(undefined), useTrackingState: () => ({ active: false, rideId: null, message: 'Tracking is off', lastSyncedAt: null }) }));
jest.mock('@stores/offlineQueueStore', () => ({ pendingTripStatus: (status: string) => status, useOfflineQueue: () => ({ enqueue: mockEnqueue, queue: [], conflicts: [], dismissConflict: jest.fn(), retry: jest.fn(), cancelTripActions: jest.fn() }) }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: { getRide: jest.fn(), getRideActions: jest.fn(), getRideLocationSnapshot: jest.fn(), postRideAction: jest.fn(), addRideNote: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks(); mockConnected = true;
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockRide = { id: 10, rideNumber: 'TRIP-10', status: 'ASSIGNED', serviceType: 'GENERAL_TRANSPORT', tripType: 'ONE_WAY', scheduledPickupAt: '2026-11-10T10:00:00', riderName: 'Sample Rider', pickupAddress: 'Pickup', dropoffAddress: 'Destination', operationalNotes: 'Existing note' } as DriverPortalRideDetailRecord;
  jest.mocked(driverPortalApi.getRide).mockImplementation(async () => mockRide);
  jest.mocked(driverPortalApi.getRideActions).mockResolvedValue({});
  jest.mocked(driverPortalApi.getRideLocationSnapshot).mockResolvedValue(null);
  jest.mocked(driverPortalApi.postRideAction).mockImplementation(async () => ({ ...mockRide, status: 'DRIVER_EN_ROUTE' }));
  jest.mocked(driverPortalApi.addRideNote).mockImplementation(async (_id, note) => { mockRide = { ...mockRide, operationalNotes: note }; return mockRide; });
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); jest.restoreAllMocks(); });
async function openTrip() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } }); clients.push(client);
  render(<QueryClientProvider client={client}><DriverRideDetailPage /></QueryClientProvider>);
  await screen.findByText('TRIP-10');
}
async function confirmAction() {
  fireEvent.press(screen.getByRole('button', { name: 'Mark En Route' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
  await act(async () => { buttons.find(button => button.text === 'Confirm')!.onPress!(); });
}
it('requires confirmation before enqueueing an offline action', async () => {
  mockConnected = false; await openTrip();
  fireEvent.press(screen.getByRole('button', { name: 'Mark En Route' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Confirm offline action', expect.any(String), expect.any(Array), expect.any(Object)));
  expect(mockEnqueue).not.toHaveBeenCalled();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
  act(() => { buttons.find(button => button.text === 'Confirm')!.onPress!(); });
  expect(mockEnqueue).toHaveBeenCalledWith(10, 'driver-en-route', { tenantId: 'tenant-a', userId: 7 }, 'ASSIGNED');
  expect(driverPortalApi.postRideAction).not.toHaveBeenCalled();
});
it('sends the displayed status with an online transition to reject stale assignments', async () => {
  await openTrip(); await confirmAction();
  await waitFor(() => expect(driverPortalApi.postRideAction).toHaveBeenCalledWith(10, 'driver-en-route', expect.any(String), 'ASSIGNED'));
});
it('saves a trip note and clears the draft only after success', async () => {
  await openTrip(); fireEvent.changeText(screen.getByLabelText('Trip note'), '  Boarding completed safely.  ');
  fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() => expect(driverPortalApi.addRideNote).toHaveBeenCalledWith(10, 'Boarding completed safely.'));
  await waitFor(() => expect(screen.getByLabelText('Trip note')).toHaveProp('value', ''));
});
it('retains the draft if the note cannot be saved', async () => {
  jest.mocked(driverPortalApi.addRideNote).mockRejectedValueOnce(new Error('Connection lost'));
  await openTrip(); fireEvent.changeText(screen.getByLabelText('Trip note'), 'Please call dispatch.');
  fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Note could not be saved', 'Connection lost'));
  expect(screen.getByLabelText('Trip note')).toHaveProp('value', 'Please call dispatch.');
});
it('stops only this trip after drop-off', async () => {
  mockRide = { ...mockRide, status: 'DROPPED_OFF' }; await openTrip();
  expect(stopTripTracking).toHaveBeenCalledWith({ rideId: 10, tenantId: 'tenant-a', userId: 7 });
});

it('stops sharing immediately after confirming an offline drop-off', async () => {
  mockConnected = false; mockRide = { ...mockRide, status: 'PICKED_UP' };
  await openTrip();
  fireEvent.press(screen.getByRole('button', { name: 'Confirm Drop Off' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  const buttons = jest.mocked(Alert.alert).mock.calls[jest.mocked(Alert.alert).mock.calls.length - 1][2]!;
  await act(async () => { buttons.find(button => button.text === 'Confirm')!.onPress!(); });
  expect(mockEnqueue).toHaveBeenCalledWith(10, 'dropped-off', { tenantId: 'tenant-a', userId: 7 }, 'PICKED_UP');
  expect(stopTripTracking).toHaveBeenCalledWith({ rideId: 10, tenantId: 'tenant-a', userId: 7 });
  expect(driverPortalApi.postRideAction).not.toHaveBeenCalled();
});
