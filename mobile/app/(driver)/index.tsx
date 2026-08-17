import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { runtimeApi } from '@api/runtimeApi';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { AppCard } from '@components/ui';
import { useAuth } from '@auth/AuthContext';
import { Colors, Shadow, Spacing, Typography } from '@theme/tokens';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-dashboard'],
    queryFn: () => driverPortalApi.getDashboard(),
  });
  const { data: tenantBranding } = useQuery({
    queryKey: ['tenant-branding', session?.identity.tenantId],
    queryFn: () => runtimeApi.getTenantBranding(session?.identity.tenantId ?? ''),
    enabled: Boolean(session?.identity.tenantId),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) return <LoadingState />;

  const fullName = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(' ') || 'Driver';
  const tenantName = tenantBranding?.displayName?.trim() || 'Transport Platform';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.greeting}>{fullName}</Text>
            <Text style={styles.name}>{tenantName}</Text>
          </View>
          <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
        </View>
      </View>

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
        <AppCard style={styles.alertCard}>
          <Text style={styles.alertText}>
            Compliance attention needed for {data?.unresolvedComplianceIssues} active item(s).
          </Text>
          <Text
            style={styles.alertLink}
            onPress={() => router.push('/(driver)/compliance')}
          >
            Review now →
          </Text>
        </AppCard>
      )}

      <View style={styles.quickActions}>
        <AppCard style={styles.actionCard}>
          <Text style={styles.actionEyebrow}>Trips</Text>
          <Text
            style={styles.actionTitle}
            onPress={() => router.push('/(driver)/rides')}
          >
            View ride queue →
          </Text>
          <Text style={styles.actionCaption}>
            Open assigned rides, confirm milestones, and monitor live tracking.
          </Text>
        </AppCard>
        <AppCard style={styles.actionCard}>
          <Text style={styles.actionEyebrow}>Manifest</Text>
          <Text
            style={styles.actionTitle}
            onPress={() => router.push('/(driver)/routes')}
          >
            View routes →
          </Text>
          <Text style={styles.actionCaption}>
            Review stop sequences, manifest notes, and route progress before departure.
          </Text>
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxxxl },
  hero: {
    backgroundColor: Colors.surfaceStrong,
    borderRadius: 28,
    padding: Spacing.xxl,
    ...Shadow.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.secondaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  name: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxxl,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  signOut: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textInverse,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  alertCard: {
    backgroundColor: '#fff7eb',
    borderColor: '#f5cf8d',
    gap: Spacing.xs,
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
  actionCard: {
    gap: Spacing.xs,
  },
  actionEyebrow: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.secondaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  actionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.primary,
  },
  actionCaption: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});
