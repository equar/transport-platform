import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { TripTrackingCard } from '../TripTrackingCard';

afterEach(cleanup);

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
  expect(screen.UNSAFE_getByType(MapView).props.region).toEqual(expect.objectContaining({ latitude: updated.latitude, longitude: updated.longitude }));
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
