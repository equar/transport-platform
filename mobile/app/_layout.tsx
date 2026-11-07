import { mobileRoleGroup } from "@auth/access";
import { LoadingState } from "@components/LoadingState";
import { OfflineSyncStatus } from '@components/OfflineSyncStatus';
import { useEffect, useMemo } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
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
import { AppState } from 'react-native';
import { refreshTripTracking } from '../src/tracking/activeTrip';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { Colors } from '@theme/tokens';

SplashScreen.preventAutoHideAsync();

function SessionQueries({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const owner = `${session?.identity.tenantId ?? ''}:${session?.identity.id ?? 'anonymous'}:${session?.identity.roles.slice().sort().join(',') ?? ''}`;
  const client = useMemo(() => new QueryClient({
    defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
  }), [owner]);
  useEffect(() => () => { void client.cancelQueries(); client.clear(); }, [client]);
  return <QueryClientProvider key={owner} client={client}>{children}</QueryClientProvider>;
}

function AuthGate() {
  const client = useQueryClient();
  const { isAuthenticated, isLoading, getDefaultRoute, session } = useAuth();
  const segments: readonly string[] = useSegments();
  const router = useRouter();
  const { drain } = useOfflineQueue();
  usePushNotifications();

  useEffect(() => {
    if (!session?.identity.roles.includes('ROLE_DRIVER')) return;
    void refreshTripTracking();
    const timer = setInterval(() => void refreshTripTracking(), 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refreshTripTracking(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [session?.identity.id]);

  // Drain offline queue when connectivity restores
  useEffect(() => {
    async function sync() {
      if (!session?.identity.tenantId || !session.identity.roles.includes('ROLE_DRIVER')) return;
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable !== false) {
        const result = await drain({ tenantId: session.identity.tenantId, userId: session.identity.id });
        if (result.success || result.conflicts) await client.invalidateQueries();
      }
    }
    const unsub = NetInfo.addEventListener(() => { void sync(); });
    const timer = setInterval(() => { void sync(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void sync(); });
    return () => { unsub(); clearInterval(timer); listener.remove(); };
  }, [drain, session?.identity.id, session?.identity.tenantId, session?.identity.roles]);

  const inAuth = segments[0] === '(auth)';
  const passwordScreen = inAuth && segments[1] === 'change-password';
  const group = mobileRoleGroup(session);
  const authorized = isAuthenticated
    ? session?.identity.mustChangePassword ? passwordScreen : !!group && segments[0] === group
    : inAuth && !passwordScreen;
  useEffect(() => {
    if (!isLoading && !authorized) router.replace(getDefaultRoute() as never);
  }, [isLoading, authorized, session, segments]);
  if (isLoading || !authorized) return <LoadingState message="Preparing your account…" />;

  return (
    <>
    <OfflineSyncStatus />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(rider)" />
      <Stack.Screen name="(guardian)" />
      <Stack.Screen name="+not-found" />
    </Stack>
    </>
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
          <StatusBar style="dark" />
          <ThemeProvider>
            <AuthProvider>
              <SessionQueries><AuthGate /></SessionQueries>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
