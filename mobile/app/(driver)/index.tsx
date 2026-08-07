import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { useAuth } from '@auth/AuthContext';
import { MobileHero } from '@components/MobileHero';
import { ActionRow } from '@components/ActionRow';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-dashboard'],
    queryFn: () => driverPortalApi.getDashboard(),
  });

  if (isLoading) return <LoadingState />;

  const name = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(' ') || 'Driver';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
      </View>

      <MobileHero eyebrow="Driver command center" title="Ready for the road." description="Everything important for today’s service, in the order you need it." icon="steering" />

      <SectionHeader title="Today's Overview" />

      <View style={styles.metricGrid}>
        <MetricTile label="Rides Today" value={data?.ridesToday ?? 0} accent />
        <MetricTile label="Assigned" value={data?.assignedRides ?? 0} />
        <MetricTile label="Routes" value={data?.activeRoutesToday ?? 0} />
        <MetricTile
          label="Compliance"
          value={data?.unresolvedComplianceIssues ?? 0}
          warning={(data?.unresolvedComplianceIssues ?? 0) > 0}
        />
      </View>

      {(data?.unresolvedComplianceIssues ?? 0) > 0 && (
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            ⚠ You have {data?.unresolvedComplianceIssues} unresolved compliance issue(s).
          </Text>
          <Text
            style={styles.alertLink}
            onPress={() => router.push('/(driver)/compliance')}
          >
            Review now →
          </Text>
        </View>
      )}

      <SectionHeader title="Start here" subtitle="Your highest-priority tools for today" />
      <View style={styles.quickActions}>
        <ActionRow icon="car-clock" title="Ride queue" description={`${data?.assignedRides ?? 0} rides currently assigned`} onPress={() => router.push('/(driver)/rides')} />
        <ActionRow icon="map-marker-path" title="Today’s routes" description="Stops, timing, and rider details" onPress={() => router.push('/(driver)/routes')} tone="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  greeting: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: 'rgba(255,255,255,.72)',
  },
  name: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  signOut: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.white,
    textDecorationLine: 'underline',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  alert: {
    borderWidth: 1,
    borderColor: Colors.warning,
    backgroundColor: '#fff3e0',
    padding: Spacing.md,
    gap: Spacing.xs,
    borderRadius: Radius.md,
  },
  alertText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.warning,
  },
  alertLink: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.primary,
  },
  quickActions: { gap: Spacing.sm },
});
