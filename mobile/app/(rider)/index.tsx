import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { useAuth } from '@auth/AuthContext';
import { MobileHero } from '@components/MobileHero';
import { ActionRow } from '@components/ActionRow';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export default function RiderDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderPortalApi.getDashboard(),
  });

  if (isLoading) return <LoadingState />;

  const name = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(' ') || 'Rider';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
      </View>

      <MobileHero eyebrow="Your transportation" title="Your next ride, without the guesswork." description="Pickup details, live service updates, and billing in one calm place." icon="map-marker-check-outline" />

      <SectionHeader title="Overview" />

      <View style={styles.metricGrid}>
        <MetricTile label="Upcoming Rides" value={data?.upcomingRideCount ?? 0} accent />
        <MetricTile label="Active Rides" value={data?.activeRideCount ?? 0} />
        <MetricTile label="Open Invoices" value={data?.openInvoiceCount ?? 0} warning={(data?.openInvoiceCount ?? 0) > 0} />
      </View>

      {(data?.outstandingBalance ?? 0) > 0 && (
        <View style={styles.balanceAlert}>
          <Text style={styles.balanceText}>
            Outstanding balance: ${data?.outstandingBalance.toFixed(2)}
          </Text>
          <Text style={styles.balanceLink} onPress={() => router.push('/(rider)/billing')}>
            View billing →
          </Text>
        </View>
      )}

      <SectionHeader title="Quick access" subtitle="The things you’re most likely to need" />
      <View style={styles.quickActions}>
        <ActionRow icon="car-clock" title="My upcoming rides" description={`${data?.upcomingRideCount ?? 0} rides currently scheduled`} onPress={() => router.push('/(rider)/rides')} />
        <ActionRow icon="credit-card-outline" title="Billing & payments" description={data?.outstandingBalance ? `$${data.outstandingBalance.toFixed(2)} outstanding` : 'Your account is up to date'} onPress={() => router.push('/(rider)/billing')} tone="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadow.card },
  greeting: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: 'rgba(255,255,255,.72)' },
  name: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.white },
  signOut: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.white, textDecorationLine: 'underline' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  balanceAlert: { borderWidth: 1, borderColor: Colors.warning, backgroundColor: '#fff3e0', padding: Spacing.md, gap: Spacing.xs, borderRadius: Radius.md },
  balanceText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.warning },
  balanceLink: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.primary },
  quickActions: { gap: Spacing.sm },
});
