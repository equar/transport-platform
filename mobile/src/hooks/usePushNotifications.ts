import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@auth/AuthContext';
import Constants from 'expo-constants';
import { pushNotificationsApi } from '@api/pushNotificationsApi';
import { getSessionValue, setSessionValue, deleteSessionValue } from '@auth/sessionStorage';

const PUSH_TOKEN_KEY = 'device_push_token';

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

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing === 'granted'
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const resolvedProjectId = resolveProjectId();
  if (!resolvedProjectId) {
    return null;
  }
  const token = await Notifications.getExpoPushTokenAsync(
    { projectId: resolvedProjectId },
  );
  return token.data;
}

export function usePushNotifications() {
  const router = useRouter();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const portalUser =
      session?.identity.roles.includes('ROLE_DRIVER') ||
      session?.identity.roles.includes('ROLE_RIDER') ||
      session?.identity.roles.includes('ROLE_GUARDIAN');

    if (portalUser) {
      registerForPushNotifications().then(async (token) => {
        if (!token) {
          return;
        }
        const platform =
          Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
            ? Platform.OS
            : 'web';
        await pushNotificationsApi.register({ token, platform });
        await setSessionValue(PUSH_TOKEN_KEY, token);
      }).catch(() => {
        // Push registration should never break app navigation.
      });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Foreground notification received — PaperProvider toasts can be triggered here
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const deepLink = typeof data?.deepLink === 'string' ? data.deepLink : '';
      if (deepLink) {
        router.push(deepLink as never);
        return;
      }
      // Navigate to relevant detail screen based on notification payload
      if (data?.rideId) {
        const explicitScope = typeof data.portalScope === 'string' ? data.portalScope.toLowerCase() : '';
        const roleScope = session?.identity.roles.includes('ROLE_DRIVER')
          ? 'driver'
          : session?.identity.roles.includes('ROLE_GUARDIAN')
            ? 'guardian'
            : session?.identity.roles.includes('ROLE_RIDER')
              ? 'rider'
              : '';
        const scope = explicitScope || roleScope || 'driver';
        router.push(`/${`(${scope})`}/rides/${data.rideId}` as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router, session]);
}

export async function unregisterCurrentPushToken() {
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
