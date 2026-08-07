import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@auth/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function usePushNotifications() {
  const router = useRouter();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        // Token registered; backend device-token endpoint can be called here
        // when the backend endpoint is available: apiClient.put('/portal/driver/device-token', { token })
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Foreground notification received — PaperProvider toasts can be triggered here
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      // Navigate to relevant detail screen based on notification payload
      if (data?.rideId) {
        const roles = session?.identity.roles ?? [];
        const ridePath = roles.includes('ROLE_DRIVER')
          ? `/(driver)/rides/${data.rideId}`
          : roles.includes('ROLE_GUARDIAN')
            ? `/(guardian)/rides/${data.rideId}`
            : `/(rider)/rides/${data.rideId}`;
        router.push(ridePath as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router, session]);
}
