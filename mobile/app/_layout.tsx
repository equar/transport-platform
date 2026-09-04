import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { Colors } from '@theme/tokens';

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
      if (state.isConnected && session?.identity.tenantId && session.identity.roles.includes('ROLE_DRIVER')) {
        drain({ tenantId: session.identity.tenantId, userId: session.identity.id });
      }
    });
    return unsub;
  }, [drain, session?.identity.id, session?.identity.tenantId, session?.identity.roles]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const authorizedGroup = session?.identity.roles.includes('ROLE_DRIVER') ? '(driver)'
      : session?.identity.roles.includes('ROLE_GUARDIAN') ? '(guardian)'
      : session?.identity.roles.includes('ROLE_RIDER') ? '(rider)'
      : null;
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace(getDefaultRoute() as never);
    } else if (isAuthenticated && (!authorizedGroup || segments[0] !== authorizedGroup)) {
      router.replace(getDefaultRoute() as never);
    }
  }, [isAuthenticated, isLoading, segments, session]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(rider)" />
      <Stack.Screen name="(guardian)" />
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: Colors.background }}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <AuthGate />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
