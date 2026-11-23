import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import DriverRidesPage from '../../../app/(driver)/rides/index';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: {} }));
jest.mock('@tanstack/react-query', () => ({ useInfiniteQuery: () => ({
  data: { pages: [{ items: [
    { id: 1, rideNumber: 'TRIP-1', status: 'COMPLETED', scheduledPickupAt: '2026-11-06T10:00:00', pickupAddress: '310 Willow Court, Boston, MA, 02110', dropoffAddress: '201 Community Circle, Boston, MA, 02110', riderName: 'Ethan Brooks' },
    { id: 2, rideNumber: 'TRIP-2', status: 'DRIVER_EN_ROUTE', scheduledPickupAt: '2026-11-06T10:00:00', pickupAddress: 'Pickup address', dropoffAddress: 'Drop-off address', riderName: 'Taylor' },
  ] }] }, isLoading: false, refetch: jest.fn(),
}) }));
it('shows completed status only in the tab and lets full addresses wrap below the date', () => {
  render(<DriverRidesPage />);
  fireEvent.press(screen.getByRole('tab', { name: 'Completed' }));
  expect(screen.getAllByText('Completed')).toHaveLength(1);
  const pickup = screen.getByText('Pickup: 310 Willow Court, Boston, MA, 02110');
  const dropoff = screen.getByText('Drop-off: 201 Community Circle, Boston, MA, 02110');
  expect(pickup.props.numberOfLines).toBeUndefined();
  expect(dropoff.props.numberOfLines).toBeUndefined();
});
it('retains actionable status differences in assigned trips', () => {
  render(<DriverRidesPage />);
  expect(screen.getByText('Driver on the way')).toBeTruthy();
});
