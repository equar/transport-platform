import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@auth/AuthContext';
import Constants from 'expo-constants';
import { pushNotificationsApi } from '@api/pushNotificationsApi';
import { getSessionValue, setSessionValue, deleteSessionValue } from '@auth/sessionStorage';
import { logClientEvent } from '@utils/clientTelemetry';

const PUSH_TOKEN_KEY = 'device_push_token';
const SAFE_PORTAL_SCOPES = new Set(['driver', 'guardian', 'rider']);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveProjectId(): string | undefined {
  const easProjectId = Constants.easConfig?.projectId;
  if (easProjectId && easProjectId.trim().length > 0) {
    return easProjectId.trim();
  }

  const expoProjectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (expoProjectId && expoProjectId.trim().length > 0) {
    return expoProjectId.trim();
  }

  return undefined;
}

export type PushRegistrationStage = 'channel' | 'permission' | 'project' | 'expo-token' | 'backend' | 'storage';
export class PushRegistrationError extends Error {
  constructor(public readonly stage: PushRegistrationStage, public readonly reason: string, public readonly retryable: boolean) {
    super(`Push registration failed at ${stage}: ${reason}`);
  }
}

async function registrationStep<T>(stage: PushRegistrationStage, operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    // Only fixed classifications leave the device; never log tokens or raw SDK errors.
    const candidate = error as { message?: string; response?: { status?: number } } | null;
    const message = typeof candidate?.message === 'string' ? candidate.message.toLowerCase() : '';
    const status = candidate?.response?.status;
    const configuration = /firebase|google-services|sender.?id|invalid project|project.?id/.test(message);
    const reason = configuration ? 'configuration' : status === 401 || status === 403 ? 'access-denied'
      : status === 429 ? 'rate-limited' : status && status >= 400 && status < 500 ? 'request-rejected' : 'unavailable';
    throw new PushRegistrationError(stage, reason, !configuration && reason !== 'access-denied' && reason !== 'request-rejected');
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  // Android 13 needs a channel before the notification permission prompt.
  if (Platform.OS === 'android') {
    await registrationStep('channel', () => Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    }));
  }
  const permission = await registrationStep('permission', async () => {
    const existing = await Notifications.getPermissionsAsync();
    return existing.status === 'granted' ? existing : Notifications.requestPermissionsAsync();
  });
  if (permission.status !== 'granted') return null;

  const projectId = resolveProjectId();
  if (!projectId) throw new PushRegistrationError('project', 'missing-configuration', false);
  const token = await registrationStep('expo-token', () => Notifications.getExpoPushTokenAsync({ projectId }));
  return token.data;
}

function toSafeDeepLink(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const candidate = value.trim();
  if (!candidate.startsWith('/')) {
    return null;
  }
  if (candidate.startsWith('//') || candidate.includes('://') || candidate.includes('..')) {
    return null;
  }
  return candidate;
}

function resolvePortalScope(explicitScope: unknown, sessionRoles: string[] | undefined) {
  if (typeof explicitScope === 'string') {
    const normalized = explicitScope.toLowerCase();
    if (SAFE_PORTAL_SCOPES.has(normalized)) {
      return normalized;
    }
  }

  if (sessionRoles?.includes('ROLE_DRIVER')) {
    return 'driver';
  }
  if (sessionRoles?.includes('ROLE_GUARDIAN')) {
    return 'guardian';
  }
  if (sessionRoles?.includes('ROLE_RIDER')) {
    return 'rider';
  }
  return 'driver';
}

export function usePushNotifications() {
  const client = useQueryClient();
  const router = useRouter();
  const handled = useRef<string | null>(null);
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let active = true;
    const portalUser =
      session?.identity.roles.includes('ROLE_DRIVER') ||
      session?.identity.roles.includes('ROLE_RIDER') ||
      session?.identity.roles.includes('ROLE_GUARDIAN');

    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    if (portalUser) {
      const register = async (attempt: number) => {
        try {
          const token = await registerForPushNotifications();
          if (!active) return;
          if (!token) {
            logClientEvent('info', 'push.registration.skipped', { reason: 'no-token-or-permission' });
            return;
          }
          const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'web';
          await registrationStep('backend', () => pushNotificationsApi.register({ token, platform }));
          if (active) await registrationStep('storage', () => setSessionValue(PUSH_TOKEN_KEY, token));
        } catch (cause) {
          if (!active) return;
          const error = cause instanceof PushRegistrationError ? cause : new PushRegistrationError('expo-token', 'unknown', false);
          logClientEvent('warn', `push.registration.failed.${error.stage}.${error.reason}`);
          // Retry transient failures twice, without blocking navigation or retrying permission denial.
          if (error.retryable && attempt < 2) {
            retryTimer = setTimeout(() => { if (active) void register(attempt + 1); }, attempt === 0 ? 15000 : 60000);
          }
        }
      };
      void register(0);
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      void client.invalidateQueries();
    });

    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (!active || !session || handled.current === response.notification.request.identifier) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.tenantId !== session.identity.tenantId || Number(data?.recipientUserId) !== session.identity.id) return;
      const scope = resolvePortalScope(undefined, session.identity.roles);
      const deepLink = toSafeDeepLink(data?.deepLink);
      const rideId = Number(data?.rideId);
      if (deepLink && deepLink.startsWith(`/(${scope})/`)) {
        handled.current = response.notification.request.identifier;
        router.push(deepLink as never);
      } else if (Number.isSafeInteger(rideId) && rideId > 0) {
        handled.current = response.notification.request.identifier;
        router.push(`/(${scope})/rides/${rideId}` as never);
      }
    };
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then(response => { if (response) handleResponse(response); }).catch(() => { if (active) logClientEvent('warn', 'push.response.load.failed'); });

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router, session]);
}

export async function unregisterCurrentPushToken() {
  await Notifications.clearLastNotificationResponseAsync();
  const token = await getSessionValue(PUSH_TOKEN_KEY);
  if (!token) {
    return;
  }
  try {
    await pushNotificationsApi.unregister(token);
  } finally {
    await deleteSessionValue(PUSH_TOKEN_KEY);
  }
}
