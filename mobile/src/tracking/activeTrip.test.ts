import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { waitFor } from '@testing-library/react-native';
import { driverPortalApi } from '@api/driverPortalApi';
import { startTripTracking, stopTripTracking, refreshTripTracking, useTrackingState } from './activeTrip';
const mockStorage = new Map<string, string>();
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-location', () => ({ Accuracy: { Balanced: 3 }, requestForegroundPermissionsAsync: jest.fn(), requestBackgroundPermissionsAsync: jest.fn(), getForegroundPermissionsAsync: jest.fn(), hasStartedLocationUpdatesAsync: jest.fn(), startLocationUpdatesAsync: jest.fn(), stopLocationUpdatesAsync: jest.fn(), getCurrentPositionAsync: jest.fn() }));
jest.mock('@api/client', () => ({ SESSION_KEY: 'auth_session' }));
jest.mock('@auth/sessionStorage', () => ({ getSessionValue: async (key: string) => mockStorage.get(key) ?? null, setSessionValue: async (key: string, value: string) => { mockStorage.set(key, value); }, deleteSessionValue: async (key: string) => { mockStorage.delete(key); } }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: { getRide: jest.fn(), captureRideLocationSnapshot: jest.fn() } }));
const backgroundTask = jest.mocked(TaskManager.defineTask).mock.calls[0][1];
const trip = { rideId: 10, tenantId: 'tenant-a', userId: 7 };
const position = { coords: { latitude: 42, longitude: -71, accuracy: 5, speed: 2, heading: 90 }, timestamp: Date.now() } as Location.LocationObject;
beforeEach(async () => {
  jest.resetAllMocks(); mockStorage.clear();
  jest.mocked(Location.hasStartedLocationUpdatesAsync).mockResolvedValue(true);
  jest.mocked(Location.stopLocationUpdatesAsync).mockResolvedValue(undefined);
  await stopTripTracking();
  mockStorage.set('auth_session', JSON.stringify({ identity: { id: 7, tenantId: 'tenant-a', roles: ['ROLE_DRIVER'] } }));
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as Location.LocationPermissionResponse);
  jest.mocked(Location.requestBackgroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as Location.LocationPermissionResponse);
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as Location.LocationPermissionResponse);
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue(position);
  jest.mocked(driverPortalApi.getRide).mockResolvedValue({ status: 'PICKED_UP' } as never);
  jest.mocked(driverPortalApi.captureRideLocationSnapshot).mockResolvedValue(null);
});
it('stops sharing immediately when the ride is dropped off', async () => {
  await startTripTracking(trip);
  expect(driverPortalApi.captureRideLocationSnapshot).toHaveBeenCalledTimes(1);
  jest.mocked(driverPortalApi.getRide).mockResolvedValue({ status: 'DROPPED_OFF' } as never);
  await refreshTripTracking();
  expect(useTrackingState.getState().active).toBe(false);
  expect(mockStorage.has('active-trip-tracking')).toBe(false);
  expect(driverPortalApi.captureRideLocationSnapshot).toHaveBeenCalledTimes(1);
});
it('does not stop a different current trip when historical trip details are opened', async () => {
  await startTripTracking(trip);
  await stopTripTracking({ ...trip, rideId: 99 });
  expect(useTrackingState.getState().active).toBe(true);
  expect(JSON.parse(mockStorage.get('active-trip-tracking')!).rideId).toBe(10);
});
it('does not upload a late GPS result after tracking has been stopped', async () => {
  let resolvePosition!: (value: Location.LocationObject) => void;
  jest.mocked(Location.getCurrentPositionAsync).mockReturnValueOnce(new Promise(resolve => { resolvePosition = resolve; }));
  const starting = startTripTracking(trip);
  await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  await stopTripTracking();
  resolvePosition(position); await starting;
  expect(driverPortalApi.captureRideLocationSnapshot).not.toHaveBeenCalled();
  expect(useTrackingState.getState().active).toBe(false);
});
it('stops foreground sharing when access to the assignment is revoked', async () => {
  await startTripTracking(trip);
  jest.mocked(driverPortalApi.getRide).mockRejectedValue({ response: { status: 403 } });
  await refreshTripTracking();
  expect(useTrackingState.getState().active).toBe(false);
  expect(mockStorage.has('active-trip-tracking')).toBe(false);
});
it('does not start location sharing without foreground permission', async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as Location.LocationPermissionResponse);
  await startTripTracking(trip);
  expect(driverPortalApi.captureRideLocationSnapshot).not.toHaveBeenCalled();
  expect(mockStorage.has('active-trip-tracking')).toBe(false);
});

it('stops a native background callback when assignment access has been revoked', async () => {
  await startTripTracking(trip);
  jest.mocked(driverPortalApi.captureRideLocationSnapshot).mockClear();
  jest.mocked(driverPortalApi.getRide).mockRejectedValue({ response: { status: 403 } });
  await backgroundTask({ data: { locations: [position] }, error: null } as never);
  expect(driverPortalApi.captureRideLocationSnapshot).not.toHaveBeenCalled();
  expect(mockStorage.has('active-trip-tracking')).toBe(false);
  expect(useTrackingState.getState().active).toBe(false);
});

it('normalizes unavailable iOS speed and heading instead of rejecting valid coordinates', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ ...position, coords: { ...position.coords, speed: -1, heading: -1 } });
  await startTripTracking(trip);
  expect(driverPortalApi.captureRideLocationSnapshot).toHaveBeenCalledWith(10, expect.objectContaining({ latitude: 42, longitude: -71, speedMps: null, headingDegrees: null }));
});
