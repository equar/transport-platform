import { View, Text, Button } from 'react-native';
import { crashDetails } from '../src/utils/crashDetails';
import { logClientEvent } from '../src/utils/clientTelemetry';
import { useQueryConnectivity } from '@hooks/useQueryConnectivity';
import { runtimeApi } from '@api/runtimeApi';
import { setServiceTimezone } from '../src/utils/serviceTime';
import { mobileRoleGroup } from "@auth/access";
import { LoadingState } from "@components/LoadingState";
import { OfflineSyncStatus } from '@components/OfflineSyncStatus';
import { useEffect, useMemo, useState } from 'react';
import { getSessionValue, setSessionValue } from '../src/auth/sessionStorage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@theme/ThemeProvider';
import { useAppearancePreference } from '@theme/ThemeProvider';
import { AuthProvider, useAuth } from '@auth/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { refreshTripTracking, stopTripTracking } from '../src/tracking/activeTrip';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { useBrandingColors } from '@theme/BrandingContext';

SplashScreen.preventAutoHideAsync();

function SessionQueries({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const owner = `${session?.identity.tenantId ?? ''}:${session?.identity.id ?? 'anonymous'}:${session?.identity.roles.slice().sort().join(',') ?? ''}`;
  const client = useMemo(() => new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  }), [owner]);
  useEffect(() => () => { void client.cancelQueries(); client.clear(); }, [client]);
  return <QueryClientProvider key={owner} client={client}>{children}</QueryClientProvider>;
}

function AuthGate() {
  const client = useQueryClient();
  const [settingsOwner, setSettingsOwner] = useState<string | null>(null);
  const { isAuthenticated, isLoading, getDefaultRoute, session } = useAuth();
  const segments: readonly string[] = useSegments();
  const router = useRouter();
  const { drain } = useOfflineQueue();
  usePushNotifications();

  useEffect(() => {
    let cancelled = false;
    setServiceTimezone(null); setSettingsOwner(null);
    const tenant = session?.identity.tenantId;
    const owner = `${tenant}:${session?.identity.id}`;
    let fresh = false;
    if (tenant) {
      const key = `service_timezone_${tenant}`;
      const cached = getSessionValue(key).then(zone => {
        if (!cancelled && !fresh && zone) {
          new Intl.DateTimeFormat('en-US', { timeZone: zone });
          setServiceTimezone(zone); setSettingsOwner(owner);
        }
      }).catch(() => { /* Online settings still establish the service timezone. */ });
      void runtimeApi.capabilities().then(result => {
        if (!cancelled) {
          fresh = true; setServiceTimezone(result.operationalSettings.timezone); setSettingsOwner(owner);
          void setSessionValue(key, result.operationalSettings.timezone).catch(() => { /* Offline cache is optional. */ });
        }
      }).catch(() => { void cached.finally(() => { if (!cancelled) setSettingsOwner(owner); }); /* Unknown-zone labels remain explicit. */ });
    }
    return () => { cancelled = true; setServiceTimezone(null); };
  }, [session?.identity.id, session?.identity.tenantId]);

  useEffect(() => {
    if (isLoading) return;
    if (mobileRoleGroup(session) !== '(driver)' || session?.identity.mustChangePassword) {
      void stopTripTracking().catch(() => logClientEvent('warn', 'tracking.stop.failed'));
      return;
    }
    void refreshTripTracking().catch(() => logClientEvent('warn', 'tracking.refresh.failed'));
    const timer = setInterval(() => void refreshTripTracking().catch(() => logClientEvent('warn', 'tracking.refresh.failed')), 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refreshTripTracking().catch(() => logClientEvent('warn', 'tracking.refresh.failed')); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [isLoading, session?.identity.id, session?.identity.roles, session?.identity.mustChangePassword]);

  // Drain offline queue when connectivity restores
  useEffect(() => {
    if (mobileRoleGroup(session) !== '(driver)' || session?.identity.mustChangePassword) return;
    async function sync() {
      if (!session?.identity.tenantId || !session.identity.roles.includes('ROLE_DRIVER')) return;
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable !== false) {
        const result = await drain({ tenantId: session.identity.tenantId, userId: session.identity.id });
        if (result.success || result.conflicts) await client.invalidateQueries();
      }
    }
    const unsub = NetInfo.addEventListener(() => { void sync().catch(() => logClientEvent('warn', 'offline.sync.failed')); });
    const timer = setInterval(() => { void sync().catch(() => logClientEvent('warn', 'offline.sync.failed')); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void sync().catch(() => logClientEvent('warn', 'offline.sync.failed')); });
    return () => { unsub(); clearInterval(timer); listener.remove(); };
  }, [drain, session?.identity.id, session?.identity.tenantId, session?.identity.roles, session?.identity.mustChangePassword]);

  const inAuth = segments[0] === '(auth)';
  const passwordScreen = inAuth && segments[1] === 'change-password';
  const group = mobileRoleGroup(session);
  const authorized = isAuthenticated
    ? !group ? segments[0] === 'unsupported' : session?.identity.mustChangePassword ? passwordScreen : segments[0] === group
    : inAuth && !passwordScreen;
  useEffect(() => {
    if (!isLoading && !authorized) router.replace(getDefaultRoute() as never);
  }, [isLoading, authorized, session, segments]);
  if (isLoading || (session?.identity.tenantId && settingsOwner !== `${session.identity.tenantId}:${session.identity.id}`) || !authorized) return <LoadingState message="Preparing your account…" />;

  return (
    <>
    {group === '(driver)' ? <OfflineSyncStatus /> : null}
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(rider)" />
      <Stack.Screen name="(guardian)" />
      <Stack.Screen name="unsupported" />
      <Stack.Screen name="+not-found" />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  useQueryConnectivity();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider><ThemedAppRoot /></ThemeProvider>
  );
}

function ThemedAppRoot() {
  const colors = useBrandingColors();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionQueries><AppViewport><AuthGate /></AppViewport></SessionQueries>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppViewport({ children }: { children: React.ReactNode }) {
  const segments = useSegments() as readonly string[];
  const colors = useBrandingColors();
  const { resolvedScheme } = useAppearancePreference();
  const auth = segments[0] === '(auth)';
  return <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 1000, alignSelf: 'center', backgroundColor: auth ? colors.surface : colors.secondaryDark }} edges={['top', 'left', 'right', 'bottom']}>
    <StatusBar style={auth && resolvedScheme !== 'dark' ? 'dark' : 'light'} />
    {children}
  </SafeAreaView>;
}

export function ErrorBoundary({ retry, error }: { retry: () => void; error: Error }) {
  useEffect(() => { logClientEvent('error', 'ui.render.failed', crashDetails(error)); }, [error]);
  return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 24, color: '#142831' }}>This screen could not open</Text>
    <Text style={{ color: '#142831' }}>If you were updating a trip, refresh it to confirm the result before submitting again.</Text>
    <Button title="Try again" onPress={retry} />
  </View>;
}
