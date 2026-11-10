import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrandingColors } from '@theme/BrandingContext';
import { Colors, Radius, Typography } from '@theme/tokens';
import { BrandWordmark } from './BrandWordmark';

export function RoleShell({ role, children }: { role: 'driver' | 'rider' | 'guardian'; children: ReactNode }) {
  const colors = useBrandingColors();
  const router = useRouter();
  const segments = useSegments() as readonly string[];
  const page = segments[1] ?? 'index';
  const home = page === 'index';
  const detail = segments.length > 2 && segments[2] !== 'index';
  const titles: Record<string, string> = { rides: detail ? 'Trip Details' : role === 'driver' ? 'Trips' : 'Rides', routes: detail ? 'Route Manifest' : 'My Routes', profile: 'Profile', notifications: 'Notifications', schedule: 'Trips', compliance: 'Documents & Compliance', vehicle: 'My Vehicles', riders: 'Linked Riders', billing: 'Billing & Payments' };
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/(${role})` as never);
  };
  return <View style={[styles.shell, { backgroundColor: colors.secondaryDark }]}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={home ? 'Open account' : 'Go back'} hitSlop={4} style={styles.iconButton} onPress={home ? () => router.push(`/(${role})/profile` as never) : back}>
        <MaterialCommunityIcons name={home ? 'menu' : 'arrow-left'} size={25} color={Colors.white} />
      </Pressable>
      <View style={styles.center}>{home ? <BrandWordmark compact /> : <Text accessibilityRole="header" style={styles.title}>{titles[page] ?? 'Bakaroo Transport'}</Text>}</View>
      {home ? <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" style={styles.iconButton} onPress={() => router.push(`/(${role})/notifications` as never)}><MaterialCommunityIcons name="bell-outline" color={Colors.white} size={23} /></Pressable> : <View style={styles.iconButton} />}
    </View>
    <View style={styles.body}>{children}</View>
  </View>;
}
const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', paddingBottom: 5 },
  iconButton: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  title: { fontFamily: Typography.fontBodyBold, color: Colors.white, fontSize: 18, textAlign: 'center' },
  body: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden' },
});
