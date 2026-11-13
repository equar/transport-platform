import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationsScreen from './NotificationsScreen';
import { notificationsApi } from '@api/notificationsApi';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: null }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/notificationsApi', () => ({ notificationsApi: { search: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn() } }));
const clients: QueryClient[] = [];
let read = false;
const alert = { id: 4, title: 'Pickup update', message: 'Your pickup time has changed.', notificationType: 'RIDE_UPDATED', channel: 'IN_APP', createdAt: '2026-11-06T12:00:00Z', relatedEntityType: null, relatedEntityId: null, sentAt: '2026-11-06T12:00:00Z', readStatus: 'UNREAD' };
beforeEach(() => {
  jest.clearAllMocks(); read = false;
  jest.mocked(notificationsApi.search).mockImplementation(async params => ({ page: Number(params?.page ?? 0), size: 20, totalPages: 2, totalElements: 2,
    items: params?.page === 1 ? [{ ...alert, id: 5, title: 'Earlier alert', readStatus: 'READ' as const }] : [{ ...alert, readStatus: read ? 'READ' as const : 'UNREAD' as const }],
  }));
  jest.mocked(notificationsApi.markRead).mockImplementation(async () => { read = true; });
  jest.mocked(notificationsApi.markAllRead).mockImplementation(async () => { read = true; });
});
afterEach(() => { for (const client of clients) client.clear(); clients.length = 0; });
function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } }); clients.push(client); return render(<QueryClientProvider client={client}><NotificationsScreen /></QueryClientProvider>); }
it('loads older alerts instead of limiting users to the first page', async () => {
  mount(); await screen.findByText('Pickup update');
  fireEvent.press(screen.getByRole('button', { name: 'Load more alerts' }));
  await screen.findByText('Earlier alert');
  expect(notificationsApi.search).toHaveBeenCalledWith({ page: 1, size: 20 });
  expect(screen.queryByRole('button', { name: 'Load more alerts' })).toBeNull();
});
it('marks a specific alert read and refreshes the visible unread controls', async () => {
  mount(); await screen.findByText('Pickup update');
  fireEvent.press(screen.getByRole('button', { name: 'Mark as read' }));
  await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalledWith(4));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull());
});
