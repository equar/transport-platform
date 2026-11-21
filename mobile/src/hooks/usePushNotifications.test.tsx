import { act, cleanup, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, usePushNotifications } from './usePushNotifications';
import { pushNotificationsApi } from '@api/pushNotificationsApi';
import { logClientEvent } from '@utils/clientTelemetry';
const mockRouter = { push: jest.fn() };
const mockSession = { identity: { id: 7, tenantId: 'tenant-a', mustChangePassword: false, roles: ['ROLE_GUARDIAN'] } };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: mockSession }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { easConfig: { projectId: 'test-project' } } }));
jest.mock('@api/pushNotificationsApi', () => ({ pushNotificationsApi: { register: jest.fn() } }));
jest.mock('@auth/sessionStorage', () => ({ setSessionValue: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@utils/clientTelemetry', () => ({ logClientEvent: jest.fn() }));
jest.mock('expo-notifications', () => ({
 setNotificationHandler: jest.fn(), AndroidImportance: { MAX: 5 },
 setNotificationChannelAsync: jest.fn(), getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(), getExpoPushTokenAsync: jest.fn(),
 addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })), addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
}));
beforeEach(() => { mockSession.identity.mustChangePassword = false;
 jest.clearAllMocks(); jest.useFakeTimers(); jest.replaceProperty(Platform, 'OS', 'android');
 jest.mocked(Notifications.setNotificationChannelAsync).mockResolvedValue(null);
 jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never);
 jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'private-push-token' } as never);
 jest.mocked(pushNotificationsApi.register).mockResolvedValue('Registered');
});
afterEach(() => { cleanup(); jest.useRealTimers(); jest.restoreAllMocks(); });
it('creates the Android channel before asking for permission', async () => {
 jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as never);
 jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' } as never);
 expect(await registerForPushNotifications()).toBe('private-push-token');
 expect(jest.mocked(Notifications.setNotificationChannelAsync).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(Notifications.getPermissionsAsync).mock.invocationCallOrder[0]);
});
it('does not attempt to create a token after permission denial', async () => {
 jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as never);
 jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as never);
 expect(await registerForPushNotifications()).toBeNull();
 expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
});
it('classifies Firebase configuration failures without leaking the raw error or retrying', async () => {
 jest.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValueOnce(new Error('Default FirebaseApp is not initialized secret details'));
 renderHook(() => usePushNotifications());
 await act(async () => {});
 expect(logClientEvent).toHaveBeenCalledWith('warn', 'push.registration.failed.expo-token.configuration');
 await act(async () => { await jest.advanceTimersByTimeAsync(90000); });
 expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
});
it('retries a transient backend failure and cancels pending retries on unmount', async () => {
 jest.mocked(pushNotificationsApi.register).mockRejectedValue(new Error('Network error'));
 const { unmount } = renderHook(() => usePushNotifications());
 await act(async () => {});
 expect(logClientEvent).toHaveBeenCalledWith('warn', 'push.registration.failed.backend.unavailable');
 await act(async () => { await jest.advanceTimersByTimeAsync(15000); });
 expect(pushNotificationsApi.register).toHaveBeenCalledTimes(2);
 unmount();
 await act(async () => { await jest.advanceTimersByTimeAsync(60000); });
 expect(pushNotificationsApi.register).toHaveBeenCalledTimes(2);
});

it('does not register notifications before the required password change', async () => {
 mockSession.identity.mustChangePassword = true;
 renderHook(() => usePushNotifications());
 await act(async () => {});
 expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
 expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
});
