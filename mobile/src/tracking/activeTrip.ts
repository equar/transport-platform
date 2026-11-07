import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { driverPortalApi } from '@api/driverPortalApi';
import { getSessionValue, setSessionValue, deleteSessionValue } from '@auth/sessionStorage';
import { SESSION_KEY } from '@api/client';

const TASK = 'active-trip-location';
const KEY = 'active-trip-tracking';
const ACTIVE = new Set(['DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'DROPPED_OFF']);
interface ActiveTrip { rideId: number; tenantId: string; userId: number }
export const useTrackingState = create<{ lastSyncedAt: string | null; message: string; active: boolean }>(() => ({
  lastSyncedAt: null, message: 'Tracking is off', active: false,
}));
let trackingGeneration = 0;
let foregroundBusy = false;

async function owner(): Promise<ActiveTrip | null> {
  const raw = await getSessionValue(KEY);
  const sessionRaw = await getSessionValue(SESSION_KEY);
  if (!raw || !sessionRaw) return null;
  const trip = JSON.parse(raw) as ActiveTrip;
  const session = JSON.parse(sessionRaw);
  return trip.userId === session.identity.id && trip.tenantId === session.identity.tenantId ? trip : null;
}
async function send(location: Location.LocationObject) {
  const trip = await owner();
  if (!trip) return;
  await driverPortalApi.captureRideLocationSnapshot(trip.rideId, {
    latitude: location.coords.latitude, longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy, speedMps: location.coords.speed,
    headingDegrees: location.coords.heading, capturedAt: new Date(location.timestamp).toISOString(),
  });
  useTrackingState.setState({ active: true, lastSyncedAt: new Date().toISOString() });
}
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    const trip = await owner();
    if (!trip) { await stopTripTracking(); return; }
    const ride = await driverPortalApi.getRide(trip.rideId);
    if (!ACTIVE.has(ride.status)) { await stopTripTracking(); return; }
    await send(data.locations[data.locations.length - 1]);
  } catch { useTrackingState.setState({ message: 'Location sync unavailable. Retrying when connected.' }); }
});
export async function stopTripTracking() {
  trackingGeneration++;
  await deleteSessionValue(KEY);
  if (Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
  useTrackingState.setState({ active: false, message: 'Tracking is off', lastSyncedAt: null });
}
export async function startTripTracking(trip: ActiveTrip) {
  if (Platform.OS === 'web') return;
  const epoch = trackingGeneration;
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') { useTrackingState.setState({ message: 'Location permission is required for trip tracking.' }); return; }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (epoch !== trackingGeneration) return;
  await setSessionValue(KEY, JSON.stringify(trip));
  useTrackingState.setState({ active: true, message: background.status === 'granted' ? 'Active trip tracking' : 'Tracking while app is open. Allow background location in Settings to track while navigating.' });
  if (background.status === 'granted' && !await Location.hasStartedLocationUpdatesAsync(TASK)) {
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 50,
      pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: 'Trip tracking active', notificationBody: 'Your location is shared for the current trip.' },
    });
  }
  await refreshTripTracking();
}
export async function refreshTripTracking() {
  if (foregroundBusy || Platform.OS === 'web') return;
  foregroundBusy = true;
  try {
    const trip = await owner();
    if (!trip) return;
    const ride = await driverPortalApi.getRide(trip.rideId);
    if (!ACTIVE.has(ride.status)) { await stopTripTracking(); return; }
    if ((await Location.getForegroundPermissionsAsync()).status !== 'granted') return;
    await send(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  } catch { useTrackingState.setState({ message: 'Location sync unavailable. Check connection and permissions.' }); }
  finally { foregroundBusy = false; }
}
