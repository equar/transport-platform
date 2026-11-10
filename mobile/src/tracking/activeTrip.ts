import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { driverPortalApi } from '@api/driverPortalApi';
import { getSessionValue, setSessionValue, deleteSessionValue } from '@auth/sessionStorage';
import { SESSION_KEY } from '@api/client';
import type { AuthSession } from '@auth/types';
import { isTrackableTrip } from '@utils/tripPresentation';

const TASK = 'active-trip-location';
const KEY = 'active-trip-tracking';
interface ActiveTrip { rideId: number; tenantId: string; userId: number }
export const useTrackingState = create<{ rideId: number | null; lastSyncedAt: string | null; message: string; active: boolean }>(() => ({
  rideId: null, lastSyncedAt: null, message: 'Tracking is off', active: false,
}));
let trackingGeneration = 0;
let foregroundBusy = false;
let nativeTransition: Promise<void> = Promise.resolve();
const sameTrip = (a: ActiveTrip | null, b: ActiveTrip) => a?.rideId === b.rideId && a.tenantId === b.tenantId && a.userId === b.userId;
function nativeUpdate(operation: () => Promise<void>) {
  const pending = nativeTransition.then(operation, operation);
  nativeTransition = pending.catch(() => undefined);
  return pending;
}
async function storedTrip(): Promise<ActiveTrip | null> {
  try {
    const raw = await getSessionValue(KEY);
    const trip = raw ? JSON.parse(raw) as ActiveTrip : null;
    return trip && Number.isSafeInteger(trip.rideId) && trip.rideId > 0 && Number.isSafeInteger(trip.userId) && trip.tenantId ? trip : null;
  } catch { return null; }
}
async function sessionMatches(trip: ActiveTrip) {
  try {
    const raw = await getSessionValue(SESSION_KEY);
    const session = raw ? JSON.parse(raw) as AuthSession : null;
    return session?.identity.id === trip.userId && session.identity.tenantId === trip.tenantId && session.identity.roles.includes('ROLE_DRIVER');
  } catch { return false; }
}
async function owner(): Promise<ActiveTrip | null> {
  const trip = await storedTrip();
  return trip && await sessionMatches(trip) ? trip : null;
}
async function send(location: Location.LocationObject, trip: ActiveTrip, epoch: number) {
  if (epoch !== trackingGeneration || !sameTrip(await owner(), trip) || epoch !== trackingGeneration) return;
  await driverPortalApi.captureRideLocationSnapshot(trip.rideId, {
    latitude: location.coords.latitude, longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy, speedMps: location.coords.speed,
    headingDegrees: location.coords.heading, capturedAt: new Date(location.timestamp).toISOString(),
  });
  if (epoch === trackingGeneration) useTrackingState.setState({ active: true, lastSyncedAt: new Date().toISOString() });
}
async function syncFailure(error: unknown, trip: ActiveTrip | null, epoch: number) {
  if (epoch !== trackingGeneration) return;
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status && [401, 403, 404].includes(status)) {
    await stopTripTracking(trip ?? undefined);
    if (trackingGeneration === epoch + 1 && useTrackingState.getState().rideId === null && !useTrackingState.getState().active) useTrackingState.setState({ message: 'Location sharing stopped because trip access changed.' });
  } else useTrackingState.setState({ message: 'Location sync unavailable. Check connection and permissions.' });
}
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const epoch = trackingGeneration;
  let trip: ActiveTrip | null = null;
  try {
    trip = await owner();
    if (epoch !== trackingGeneration) return;
    if (!trip) { await stopTripTracking(); return; }
    const ride = await driverPortalApi.getRide(trip.rideId);
    if (epoch !== trackingGeneration) return;
    if (!isTrackableTrip(ride.status)) { await stopTripTracking(trip); return; }
    await send(data.locations[data.locations.length - 1], trip, epoch);
  } catch (cause) { await syncFailure(cause, trip, epoch); }
});
export async function stopTripTracking(expectedTrip?: ActiveTrip) {
  const epoch = trackingGeneration;
  if (expectedTrip && (!sameTrip(await storedTrip(), expectedTrip) || epoch !== trackingGeneration)) return;
  const stoppedAt = ++trackingGeneration;
  useTrackingState.setState({ rideId: null, active: false, message: 'Tracking is off', lastSyncedAt: null });
  await deleteSessionValue(KEY);
  await nativeUpdate(async () => {
    if (stoppedAt === trackingGeneration && Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
  });
}
export async function startTripTracking(trip: ActiveTrip) {
  if (Platform.OS === 'web') return;
  const epoch = ++trackingGeneration;
  const ride = await driverPortalApi.getRide(trip.rideId);
  if (epoch !== trackingGeneration || !isTrackableTrip(ride.status) || !await sessionMatches(trip)) return;
  const permission = await Location.requestForegroundPermissionsAsync();
  if (epoch !== trackingGeneration) return;
  if (permission.status !== 'granted') { useTrackingState.setState({ rideId: trip.rideId, active: false, message: 'Location permission is required for trip tracking.' }); return; }
  let backgroundAllowed = false;
  try { backgroundAllowed = (await Location.requestBackgroundPermissionsAsync()).status === 'granted'; } catch { /* Foreground sharing remains available. */ }
  if (epoch !== trackingGeneration || !await sessionMatches(trip) || epoch !== trackingGeneration) return;
  await setSessionValue(KEY, JSON.stringify(trip));
  if (epoch !== trackingGeneration) return;
  useTrackingState.setState({ rideId: trip.rideId, active: true, lastSyncedAt: null, message: backgroundAllowed ? 'Active trip tracking' : 'Tracking while app is open. Allow background location in Settings to track while navigating.' });
  if (backgroundAllowed) {
    try {
      await nativeUpdate(async () => {
        if (epoch !== trackingGeneration) return;
        if (!await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.startLocationUpdatesAsync(TASK, {
          accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 50,
          pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
          foregroundService: { notificationTitle: 'Trip tracking active', notificationBody: 'Your location is shared for the current trip.' },
        });
      });
    } catch { if (epoch === trackingGeneration) useTrackingState.setState({ message: 'Tracking while app is open. Background tracking could not start.' }); }
  }
  if (epoch === trackingGeneration) await refreshTripTracking();
}
export async function refreshTripTracking() {
  if (foregroundBusy || Platform.OS === 'web') return;
  foregroundBusy = true;
  const epoch = trackingGeneration;
  let trip: ActiveTrip | null = null;
  try {
    trip = await owner();
    if (!trip || epoch !== trackingGeneration) return;
    const ride = await driverPortalApi.getRide(trip.rideId);
    if (epoch !== trackingGeneration) return;
    if (!isTrackableTrip(ride.status)) { await stopTripTracking(trip); return; }
    if ((await Location.getForegroundPermissionsAsync()).status !== 'granted') { await stopTripTracking(trip); return; }
    await send(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), trip, epoch);
  } catch (cause) { await syncFailure(cause, trip, epoch); }
  finally { foregroundBusy = false; }
}
