import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@theme/ThemeProvider';
import { AuthProvider, useAuth } from '@auth/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { usePushNotifications } from '@hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AuthGate() {
  const { isAuthenticated, isLoading, getDefaultRoute, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { drain } = useOfflineQueue();
  usePushNotifications();

  // Drain offline queue when connectivity restores
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) drain();
    });
    return unsub;
  }, [drain]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace(getDefaultRoute() as never);
    } else if (isAuthenticated) {
      const roles = session?.identity.roles ?? [];
      const currentGroup = segments[0];
      const canAccessCurrentGroup =
        currentGroup === 'unsupported' ||
        (currentGroup === '(driver)' && roles.includes('ROLE_DRIVER')) ||
        (currentGroup === '(rider)' && roles.includes('ROLE_RIDER')) ||
        (currentGroup === '(guardian)' && roles.includes('ROLE_GUARDIAN'));

      if (!canAccessCurrentGroup) {
        router.replace(getDefaultRoute() as never);
      }
    }
  }, [getDefaultRoute, isAuthenticated, isLoading, router, segments, session]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(rider)" />
      <Stack.Screen name="(guardian)" />
      <Stack.Screen name="unsupported" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AuthGate />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
