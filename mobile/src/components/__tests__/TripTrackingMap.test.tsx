import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { TripTrackingCard } from '../TripTrackingCard';

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('uses the native street map without third-party tile overlays and keeps the driver pin accurate', () => {
  const snapshot = { latitude: 35.4088, longitude: -80.5795, capturedAt: new Date().toISOString() };
  const { rerender } = render(<TripTrackingCard autoShowMap rideStatus="PICKED_UP" snapshot={snapshot} />);
  expect(screen.UNSAFE_getByType(MapView).props.mapType).toBe('standard');
  expect(screen.UNSAFE_queryAllByType(UrlTile)).toHaveLength(0);
  expect(screen.queryByText(/OpenStreetMap/)).toBeNull();
  expect(screen.UNSAFE_getByType(Marker).props.coordinate).toEqual({ latitude: snapshot.latitude, longitude: snapshot.longitude });
  const updated = { ...snapshot, latitude: 35.41, longitude: -80.58 };
  rerender(<TripTrackingCard autoShowMap rideStatus="PICKED_UP" snapshot={updated} />);
  expect(screen.UNSAFE_getByType(Marker).props.coordinate).toEqual({ latitude: updated.latitude, longitude: updated.longitude });
  expect(screen.UNSAFE_getByType(MapView).props.region.latitude).toBeCloseTo(updated.latitude, 6);
  expect(screen.UNSAFE_getByType(MapView).props.region.longitude).toBeCloseTo(updated.longitude, 6);
});

it('does not invent a driver pin while waiting for a valid location', () => {
  const { rerender } = render(<TripTrackingCard autoShowMap snapshot={null} />);
  expect(screen.UNSAFE_getByType(MapView).props.mapType).toBe('standard');
  expect(screen.UNSAFE_queryAllByType(Marker)).toHaveLength(0);
  rerender(<TripTrackingCard autoShowMap snapshot={{ latitude: 91, longitude: 0, capturedAt: new Date().toISOString() }} />);
  expect(screen.UNSAFE_queryAllByType(Marker)).toHaveLength(0);
  expect(screen.getByText('The latest location cannot be shown on the map.')).toBeTruthy();
});

it('keeps a single compact refresh control beside the map and prevents repeat taps while refreshing', () => {
  const onRefresh = jest.fn();
  const { rerender } = render(<TripTrackingCard autoShowMap snapshot={null} onRefresh={onRefresh} />);
  expect(screen.getAllByRole('button', { name: 'Refresh Tracking' })).toHaveLength(1);
  expect(screen.getByText('Refresh')).toBeTruthy();
  expect(screen.queryByText('Refresh Tracking')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Refresh Tracking' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
  rerender(<TripTrackingCard autoShowMap snapshot={null} onRefresh={onRefresh} refreshing />);
  expect(screen.getByRole('button', { name: 'Refresh Tracking' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Refresh Tracking' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it('draws the recorded travelled path inside the map without changing the driver marker', () => {
  const history = [
    { latitude: 35.401, longitude: -80.501, capturedAt: '2026-11-20T00:00:30Z' },
    { latitude: 35.4, longitude: -80.5, capturedAt: '2026-11-20T00:00:00Z' },
  ];
  render(<TripTrackingCard autoShowMap snapshot={history[0]} history={history} />);
  expect(screen.UNSAFE_getByType(Polyline).props.coordinates).toEqual([
    { latitude: 35.4, longitude: -80.5 }, { latitude: 35.401, longitude: -80.501 },
  ]);
  expect(screen.UNSAFE_getByType(Marker).props.coordinate).toEqual({ latitude: 35.401, longitude: -80.501 });
  expect(screen.getByText(/Recorded path travelled/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Route to pickup' })).toBeNull();
});
it('shows a useful message instead of inventing a route if history is unavailable', () => {
  render(<TripTrackingCard autoShowMap snapshot={null} historyError />);
  expect(screen.UNSAFE_queryAllByType(Polyline)).toHaveLength(0);
  expect(screen.getByText(/recorded path could not be loaded/)).toBeTruthy();
});
