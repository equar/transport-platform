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
import { DriverRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-dashboard'],
    queryFn: () => driverPortalApi.getDashboard(),
  });
  const { data: upcomingRides } = useQuery({
    queryKey: ['driver-rides-next-assigned'],
    queryFn: () =>
      driverPortalApi.searchRides({
        page: 0,
        size: 5,
        sort: 'scheduledPickupAt,asc',
      }),
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
  const nextDispatch =
    upcomingRides?.items.find((item) =>
      ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(item.status),
    ) ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTopLine}>Driver Home</Text>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <Text style={styles.onlineBadge}>Online</Text>
        </View>
        <Text style={styles.tenantName}>{tenantName}</Text>
        <View style={styles.heroFooterRow}>
          <Text style={styles.heroHint}>Manage dispatches, routes, and rides.</Text>
          <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
        </View>
      </View>

      <SectionHeader title="Today's Summary" />

      <View style={styles.metricGrid}>
        <MetricTile label="Assigned" value={data?.assignedRides ?? 0} accent />
        <MetricTile label="Completed" value={(data?.ridesToday ?? 0) - (data?.assignedRides ?? 0)} />
        <MetricTile label="Upcoming" value={Math.max((data?.activeRoutesToday ?? 0) - 1, 0)} />
        <MetricTile
          label="Driven"
          value={`${Math.max((data?.ridesToday ?? 0) * 8, 0)} mi`}
        />
      </View>

      <SectionHeader title="Next Dispatch" />

      {nextDispatch ? (
        <AppCard style={styles.dispatchCard}>
          <Text style={styles.dispatchTime}>{formatShortDateTime(nextDispatch.scheduledPickupAt)}</Text>
          <Text style={styles.dispatchRouteCode}>{nextDispatch.rideNumber}</Text>
          <Text style={styles.dispatchAddress}>{nextDispatch.pickupAddress ?? 'Pickup address unavailable'}</Text>
          <Text style={styles.dispatchAddress}>{nextDispatch.dropoffAddress ?? 'Drop-off address unavailable'}</Text>
          <Text
            style={styles.dispatchAction}
            onPress={() => router.push(`/(driver)/rides/${nextDispatch.id}`)}
          >
            View Dispatch
          </Text>
        </AppCard>
      ) : (
        <AppCard style={styles.dispatchCard}>
          <Text style={styles.dispatchTime}>No active assignment</Text>
          <Text style={styles.dispatchAddress}>You are all caught up for now.</Text>
          <Text style={styles.dispatchAction} onPress={() => router.push('/(driver)/rides')}>
            Open Dispatches
          </Text>
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxxxl },
  hero: {
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 28,
    padding: Spacing.xxl,
    ...Shadow.card,
  },
  heroTopLine: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.textOnPrimary,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.textOnPrimary,
    opacity: 0.88,
  },
  name: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: DriverRoleTheme.textOnPrimary,
    letterSpacing: -0.5,
  },
  tenantName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeMd,
    color: DriverRoleTheme.textOnPrimary,
    marginTop: Spacing.sm,
    opacity: 0.9,
  },
  onlineBadge: {
    backgroundColor: '#16a34a',
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroFooterRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroHint: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.textOnPrimary,
    opacity: 0.82,
  },
  signOut: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.textOnPrimary,
    marginLeft: Spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dispatchCard: {
    gap: Spacing.xs,
    borderColor: DriverRoleTheme.soft,
  },
  dispatchTime: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dispatchRouteCode: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
  },
  dispatchAddress: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dispatchAction: {
    marginTop: Spacing.sm,
    backgroundColor: DriverRoleTheme.primary,
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
