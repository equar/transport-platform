import React from 'react';
import { Text } from 'react-native';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GuardianHomeScreen } from './GuardianHomeScreen';
import { riderPortalApi, type RiderPortalRideRecord } from '@api/riderPortalApi';

const mockPush = jest.fn();
let mockVisible = true;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@hooks/useTripScreenVisible', () => ({ useTripScreenVisible: () => mockVisible, manualTripRefreshOptions: { retry: false, refetchInterval: false } }));
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: { identity: { firstName: 'Taylor' } } }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: { searchRides: jest.fn(), getDashboard: jest.fn() } }));
const clients: QueryClient[] = [];
function ride(id: number, riderName: string, status: string): RiderPortalRideRecord {
  return { id, riderName, status, rideNumber: `TRIP-${id}`, scheduledPickupAt: '2020-01-01T10:00:00' } as RiderPortalRideRecord;
}
const active = [ride(1, 'Mariam', 'PICKED_UP'), ride(2, 'Yonas', 'DRIVER_EN_ROUTE'), ride(3, 'Selam', 'ARRIVED')];
beforeEach(() => {
  jest.clearAllMocks(); mockVisible = true;
  jest.mocked(riderPortalApi.searchRides).mockImplementation(async params => ({
    items: params?.status ? active.filter(item => item.status === params.status) : [],
    page: Number(params?.page ?? 0), totalPages: 1, totalElements: 1, size: 20,
  }));
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><GuardianHomeScreen /></QueryClientProvider>);
}
it('puts every active linked rider before upcoming trips with a direct live-map action', async () => {
  open();
  for (const item of active) {
    const button = await screen.findByRole('button', { name: `Track ${item.riderName} trip ${item.rideNumber}` });
    fireEvent.press(button);
    expect(mockPush).toHaveBeenLastCalledWith(`/(guardian)/rides/${item.id}?track=1`);
  }
  const rendered = screen.UNSAFE_getAllByType(Text).map(node => typeof node.props.children === 'string' ? node.props.children : '').join('|');
  expect(rendered.indexOf('Active rides')).toBeLessThan(rendered.indexOf('Next trip'));
  expect(rendered.indexOf('Mariam')).toBeLessThan(rendered.indexOf('Next trip'));
  expect(riderPortalApi.getDashboard).not.toHaveBeenCalled();
  for (const item of active) expect(riderPortalApi.searchRides).toHaveBeenCalledWith({ status: item.status, page: 0, size: 20, sortBy: 'scheduledPickupAt', sortDirection: 'ASC' });
});
it('loads additional active pages and deduplicates trips that move between statuses', async () => {
  jest.mocked(riderPortalApi.searchRides).mockImplementation(async params => ({
    items: params?.status === 'PICKED_UP' ? Number(params.page) === 0 ? [active[0]] : [active[0], ride(4, 'Additional rider', 'PICKED_UP')] : [],
    page: Number(params?.page ?? 0), totalPages: params?.status === 'PICKED_UP' ? 2 : 0, totalElements: 2, size: 20,
  }));
  open();
  fireEvent.press(await screen.findByRole('button', { name: 'Load more active rides' }));
  await screen.findByRole('button', { name: 'Track Additional rider trip TRIP-4' });
  expect(screen.getAllByRole('button', { name: 'Track Mariam trip TRIP-1' })).toHaveLength(1);
  expect(riderPortalApi.searchRides).toHaveBeenCalledWith(expect.objectContaining({ status: 'PICKED_UP', page: 1 }));
});
it('keeps tracking available when the separate upcoming-trip request fails', async () => {
  const original = jest.mocked(riderPortalApi.searchRides).getMockImplementation()!;
  jest.mocked(riderPortalApi.searchRides).mockImplementation(params => params?.status ? original(params) : Promise.reject(new Error('Unavailable')));
  open();
  await screen.findByRole('button', { name: 'Track Mariam trip TRIP-1' });
  expect(await screen.findByRole('button', { name: 'Retry trips' })).toBeTruthy();
});
it('offers retry rather than an empty-state claim when active rides fail to load', async () => {
  jest.mocked(riderPortalApi.searchRides).mockRejectedValue(new Error('Unavailable'));
  open();
  await screen.findByRole('button', { name: 'Retry active rides' });
  expect(screen.queryByText('No active rides right now.')).toBeNull();
});
it('does not query rides while the guardian home screen is out of view', async () => {
  mockVisible = false;
  open();
  await act(async () => {});
  expect(riderPortalApi.searchRides).not.toHaveBeenCalled();
});
it('keeps arrival confirmation separate from active tracking', async () => {
  const original = jest.mocked(riderPortalApi.searchRides).getMockImplementation()!;
  jest.mocked(riderPortalApi.searchRides).mockImplementation(params => params?.status ? original(params) : Promise.resolve({ items: [ride(5, 'Delivered rider', 'DROPPED_OFF')], page: 0, totalPages: 1, totalElements: 1, size: 20 }));
  open();
  fireEvent.press(await screen.findByRole('button', { name: 'Review delivery' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(guardian)/rides/5');
  expect(screen.queryByRole('button', { name: 'Track Delivered rider trip TRIP-5' })).toBeNull();
});
