import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GuardianRidesPage from '../../app/(guardian)/rides/index';
import { riderPortalApi } from '@api/riderPortalApi';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/riderPortalApi', () => ({ riderPortalApi: { searchRides: jest.fn() } }));

function renderRides() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <GuardianRidesPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

it('shows an empty state for no rides in Upcoming and History without an error', async () => {
  jest.mocked(riderPortalApi.searchRides).mockResolvedValue({
    items: [], totalElements: 0, totalPages: 0, page: 0, size: 20,
  });
  renderRides();
  await waitFor(() => expect(screen.getByText('No ride records')).toBeTruthy());
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Load more trips' })).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(screen.getByText('No ride records')).toBeTruthy();
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
});

it('keeps actual request failures visible and allows retrying to an empty result', async () => {
  jest.mocked(riderPortalApi.searchRides).mockRejectedValueOnce(new Error('Connection unavailable'))
    .mockResolvedValue({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  renderRides();
  await waitFor(() => expect(screen.getByText('We couldn’t load this')).toBeTruthy());
  expect(screen.getByText('Connection unavailable')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByText('No ride records')).toBeTruthy());
  expect(screen.queryByText('We couldn’t load this')).toBeNull();
});
