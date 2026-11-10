import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
const mockSession = { accessToken: 'token', refreshToken: 'refresh', tokenType: 'Bearer', expiresInSeconds: 3600, identity: { id: 1, tenantId: 'tenant', email: 'driver@example.test', firstName: 'Taylor', lastName: 'Reed', status: 'ACTIVE', roles: ['ROLE_DRIVER'], mustChangePassword: false } };
let mockStored: string | null;
const mockDelete = jest.fn(async () => { mockStored = null; });
const mockLogout = jest.fn(() => new Promise<void>(() => {}));
jest.mock('./sessionStorage', () => ({ getSessionValue: () => Promise.resolve(mockStored), deleteSessionValue: () => mockDelete(), setSessionValue: jest.fn() }));
jest.mock('@api/client', () => ({ SESSION_KEY: 'auth_session', onSessionExpired: () => () => {}, onSessionRefreshed: () => () => {}, invalidateSessionRequests: jest.fn() }));
jest.mock('@api/authApi', () => ({ authApi: { signOut: () => mockLogout() } }));
jest.mock('../tracking/activeTrip', () => ({ stopTripTracking: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@hooks/usePushNotifications', () => ({ unregisterCurrentPushToken: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@stores/offlineQueueStore', () => ({ useOfflineQueue: { getState: () => ({ clear: jest.fn() }) } }));
function Probe() {
  const auth = useAuth();
  return <><Text>{auth.isLoading ? 'Loading' : auth.isAuthenticated ? 'Signed in' : 'Signed out'}</Text><Text accessibilityRole="button" onPress={() => auth.signOut()}>Log out</Text></>;
}
it('removes persisted credentials before reporting signed out, even while server logout is pending', async () => {
  mockStored = JSON.stringify(mockSession);
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Signed in')).toBeTruthy());
  fireEvent.press(screen.getByText('Log out'));
  await waitFor(() => expect(screen.getByText('Signed out')).toBeTruthy());
  expect(mockStored).toBeNull(); expect(mockDelete).toHaveBeenCalledTimes(1);
  view.unmount();
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Signed out')).toBeTruthy());
  expect(screen.queryByText('Signed in')).toBeNull();
});
