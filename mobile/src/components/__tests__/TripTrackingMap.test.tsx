import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';
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
