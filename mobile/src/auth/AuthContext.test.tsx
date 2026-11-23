import { setSessionValue } from './sessionStorage';
import React from 'react';
import { Text } from 'react-native';
import type { AuthSession } from './types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
const mockSession = { accessToken: 'token', refreshToken: 'refresh', tokenType: 'Bearer', expiresInSeconds: 3600, identity: { id: 1, tenantId: 'tenant', email: 'driver@example.test', firstName: 'Taylor', lastName: 'Reed', status: 'ACTIVE', roles: ['ROLE_DRIVER'], mustChangePassword: false } };
let mockStored: string | null;
let mockRefresh: ((session: AuthSession) => void) | undefined;
const mockDelete = jest.fn(async () => { mockStored = null; });
const mockSignIn = jest.fn();
const mockLogout = jest.fn((token?: string) => new Promise<void>(() => { void token; }));
jest.mock('./sessionStorage', () => ({ getSessionValue: () => Promise.resolve(mockStored), deleteSessionValue: () => mockDelete(), setSessionValue: jest.fn() }));
jest.mock('@api/client', () => ({ SESSION_KEY: 'auth_session', onSessionExpired: () => () => {}, onSessionRefreshed: (callback: (session: AuthSession) => void) => { mockRefresh = callback; return () => { mockRefresh = undefined; }; }, invalidateSessionRequests: jest.fn() }));
jest.mock('@api/authApi', () => ({ authApi: { signOut: (token: string) => mockLogout(token), signIn: (...args: unknown[]) => mockSignIn(...args) } }));
jest.mock('../tracking/activeTrip', () => ({ stopTripTracking: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@hooks/usePushNotifications', () => ({ unregisterCurrentPushToken: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@stores/offlineQueueStore', () => ({ useOfflineQueue: { getState: () => ({ clear: jest.fn(), pause: jest.fn(), retainOwner: jest.fn() }) } }));
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

it('clears access if a refreshed identity gains ambiguous mobile roles', async () => {
  mockStored = JSON.stringify(mockSession);
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Signed in')).toBeTruthy());
  act(() => mockRefresh?.({ ...mockSession, identity: { ...mockSession.identity, roles: ['ROLE_DRIVER', 'ROLE_GUARDIAN'] } }));
  await waitFor(() => expect(screen.getByText('Signed out')).toBeTruthy());
  expect(mockStored).toBeNull();
});

it('revokes the newly issued rider session if secure storage cannot save it', async () => {
  mockStored = null;
  mockSignIn.mockResolvedValueOnce({ ...mockSession, identity: { ...mockSession.identity, roles: ['ROLE_RIDER'] } });
  jest.mocked(setSessionValue).mockRejectedValueOnce(new Error('Secure storage unavailable.'));
  function SignInProbe() {
    const auth = useAuth();
    const [message, setMessage] = React.useState('');
    return <><Text>{auth.isAuthenticated ? 'Signed in' : 'Signed out'}</Text><Text>{message}</Text>
      <Text onPress={() => { void auth.signIn({ email: 'rider@example.test', password: 'test-password' }).catch(error => setMessage(error.message)); }}>Sign in rider</Text></>;
  }
  render(<AuthProvider><SignInProbe /></AuthProvider>);
  await act(async () => {});
  fireEvent.press(screen.getByText('Sign in rider'));
  await screen.findByText('Secure storage unavailable.');
  expect(mockLogout).toHaveBeenCalledWith('refresh');
  expect(screen.queryByText('Signed in')).toBeNull();
  expect(mockStored).toBeNull();
});
