import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginPage from '../../../app/(auth)/login';
import RiderRidesPage from '../../../app/(rider)/rides/index';
import { AppInput } from '../ui/AppInput';
import { Pagination } from '../Pagination';
import DriverDashboard from '../../../app/(driver)/index';
import { PassengerHomeScreen } from '../../screens/PassengerHomeScreen';
jest.mock('@hooks/useTripScreenVisible', () => ({ useTripScreenVisible: () => true, foregroundTripRefreshOptions: { retry: false, refetchInterval: false } }));
const mockFetchNextPage = jest.fn();
const mockSignIn = jest.fn(); const mockPush = jest.fn(); const mockReplace = jest.fn();
const mockRiderItems = [
  { id: 1, rideNumber: 'ACTIVE-TRIP', riderName: 'Taylor', status: 'PICKED_UP', scheduledPickupAt: '2020-01-01T10:00:00', pickupAddress: 'Pickup', dropoffAddress: 'Drop-off' },
  { id: 2, rideNumber: 'FINISHED-TRIP', riderName: 'Taylor', status: 'COMPLETED', scheduledPickupAt: '2030-01-01T10:00:00', pickupAddress: 'Pickup', dropoffAddress: 'Drop-off' },
];
let mockRides: typeof mockRiderItems = mockRiderItems;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ signIn: mockSignIn, session: { identity: { firstName: 'Taylor', tenantId: 'test-tenant' } } }) }));
jest.mock('@components/TenantHeader', () => ({ TenantHeader: () => null }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: {} }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: {} }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@tanstack/react-query', () => ({ useInfiniteQuery: () => ({
  isLoading: false, isError: false, hasNextPage: true, isFetchingNextPage: false, isRefetching: false, fetchNextPage: mockFetchNextPage, refetch: jest.fn(),
  data: { pages: [{ items: mockRides }] },
}), useQuery: ({ queryKey }: { queryKey: string[] }) => ({
  isLoading: false, isError: false, isRefetching: false, refetch: jest.fn(),
  data: queryKey[0].endsWith('-next-rides') ? { items: mockRides } : queryKey[0] === 'driver-dashboard' ? { ridesToday: 7, assignedRides: 3, activeRoutesToday: 2, unresolvedComplianceIssues: 1 } : queryKey[0].endsWith('-dashboard') ? { upcomingRideCount: 4, activeRideCount: 1, openInvoiceCount: 2, linkedRiderCount: 3, unreadNotifications: 0 } : { items: [] },
}) }));
beforeEach(() => { jest.clearAllMocks(); mockRides = mockRiderItems; });
it('centers the login heading and omits the sign-in description', () => {
  render(<LoginPage />);
  expect(screen.getByText('Welcome back')).toHaveStyle({ textAlign: 'center' });
  expect(screen.queryByText('Sign in to manage your trips and stay connected with your transport provider.')).toBeNull();
});
it('shows inline sign-in validation and keeps typed values after a failed sign-in', async () => {
  render(<LoginPage />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(mockSignIn).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('Email address'), 'taylor@example.test');
  fireEvent.changeText(screen.getByLabelText('Password'), 'test-passphrase');
  mockSignIn.mockRejectedValueOnce(new Error('Check your credentials.'));
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check your credentials.'));
  expect(screen.getByLabelText('Email address')).toHaveProp('value', 'taylor@example.test');
});
it('provides accessible password visibility controls', () => {
  render(<AppInput label="Password" value="example" onChangeText={() => {}} secureTextEntry />);
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
  fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);
  expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
});
it('keeps pagination actions short and prevents moving beyond page bounds', () => {
  const change = jest.fn(); render(<Pagination page={0} pages={3} label="Invoices" onChange={change} />);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Next' })); expect(change).toHaveBeenCalledWith(1);
});
it('shows actual driver summary fields instead of estimated miles or completion counts', () => {
  render(<DriverDashboard />);
  expect(screen.getByText('7')).toBeTruthy(); expect(screen.getByText('Assigned trips')).toBeTruthy();
  expect(screen.queryByText(/miles|completed trips/i)).toBeNull();
  expect(screen.getByText('No upcoming assignments')).toBeTruthy();
});
it('keeps guardian travel assignment-based and preserves linked rider access', () => {
  render(<PassengerHomeScreen guardian />);
  expect(screen.queryByRole('button', { name: 'Request a ride' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'All trips' })); expect(mockPush).toHaveBeenCalledWith('/(guardian)/rides');
  expect(screen.queryByText('Your next trip')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Linked riders' })); expect(mockPush).toHaveBeenCalledWith('/(guardian)/riders');
  expect(screen.queryByText('Check In')).toBeNull();
});

it('keeps delayed active rides separate from history and exposes explicit pagination', () => {
  render(<RiderRidesPage />);
  expect(screen.getByText('ACTIVE-TRIP')).toBeTruthy();
  expect(screen.queryByText('FINISHED-TRIP')).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(screen.getByText('FINISHED-TRIP')).toBeTruthy();
  expect(screen.queryByText('ACTIVE-TRIP')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Load more trips' }));
  expect(mockFetchNextPage).toHaveBeenCalled();
});

it('explains empty rider pages and keeps the load-more action available', () => {
  mockRides = [];
  render(<RiderRidesPage />);

  expect(screen.getByText('No upcoming trips on this page')).toBeTruthy();
  expect(screen.getByText('Load more trips to check for assigned trips.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Load more trips' })).toBeTruthy();

  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(screen.getByText('No finished trips on this page')).toBeTruthy();
  expect(screen.getByText('Load more trips to view earlier trip history.')).toBeTruthy();
});

it('shows assigned travel and existing billing actions without a service catalog for riders', () => {
  render(<PassengerHomeScreen />);
  expect(screen.queryByRole('button', { name: 'Request a ride' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Student' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'All trips' }));
  expect(mockPush).toHaveBeenCalledWith('/(rider)/rides');
  fireEvent.press(screen.getByRole('button', { name: 'Invoices & payments' }));
  expect(mockPush).toHaveBeenCalledWith('/(rider)/billing');
});

it('opens the live map from the guardian home Track action, prioritizing a trip in progress', () => {
  mockRides = [{ ...mockRiderItems[0], id: 3, rideNumber: 'UPCOMING', status: 'SCHEDULED' }, ...mockRiderItems];
  render(<PassengerHomeScreen guardian />);
  fireEvent.press(screen.getByRole('button', { name: 'Track Taylor trip ACTIVE-TRIP' }));
  expect(mockPush).toHaveBeenCalledWith('/(guardian)/rides/1?track=1');
});
it('does not offer guardian tracking for finished trips', () => {
  mockRides = [mockRiderItems[1]];
  render(<PassengerHomeScreen guardian />);
  expect(screen.queryByRole('button', { name: 'Track' })).toBeNull();
});

it('keeps dropped-off trips available until final completion', () => {
  mockRides = [{ ...mockRiderItems[0], rideNumber: 'AWAITING-CONFIRMATION', status: 'DROPPED_OFF' }];
  render(<RiderRidesPage />);
  expect(screen.getByText('AWAITING-CONFIRMATION')).toBeTruthy();
  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(screen.queryByText('AWAITING-CONFIRMATION')).toBeNull();
});

it('routes a successful rider sign-in to the rider portal', async () => {
  mockSignIn.mockResolvedValueOnce({ identity: { id: 10, tenantId: 'test-tenant', roles: ['ROLE_RIDER'], mustChangePassword: false } });
  render(<LoginPage />);
  fireEvent.changeText(screen.getByLabelText('Email address'), 'rider@example.test');
  fireEvent.changeText(screen.getByLabelText('Password'), 'test-passphrase');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(rider)'));
});
