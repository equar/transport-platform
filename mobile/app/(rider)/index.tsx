import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { AppCard } from '@components/ui';
import { useAuth } from '@auth/AuthContext';
import { ActionRow } from '@components/ActionRow';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime, timeUntil } from '@utils/formatDate';

export default function RiderDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderPortalApi.getDashboard(),
  });
  const { data: rides } = useQuery({
    queryKey: ['rider-next-rides'],
    queryFn: () =>
      riderPortalApi.searchRides({
        page: 0,
        size: 6,
        sort: 'scheduledPickupAt,asc',
      }),
  });

  if (isLoading) return <LoadingState />;

  const name = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(' ') || 'Rider';
  const nextRide = rides?.items.find((ride) => !['COMPLETED', 'CANCELLED', 'MISSED', 'FAILED'].includes(ride.status)) ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.screenTitle}>Home</Text>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.onlineTag}>On Time</Text>
          <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
        </View>
      </View>

      <SectionHeader title="Upcoming Ride" />

      {nextRide ? (
        <AppCard style={styles.nextRideCard}>
          <Text style={styles.nextRideTime}>{formatShortDateTime(nextRide.scheduledPickupAt)}</Text>
          <Text style={styles.nextRideAddress}>{nextRide.pickupAddress ?? 'Pickup pending'}</Text>
          <Text style={styles.nextRideAddress}>{nextRide.dropoffAddress ?? 'Drop-off pending'}</Text>
          <View style={styles.nextRideFooter}>
            <Text style={styles.nextRideEta}>Pickup in {timeUntil(nextRide.scheduledPickupAt)}</Text>
            <Text style={styles.nextRideAction} onPress={() => router.push(`/(rider)/rides/${nextRide.id}`)}>
              Check-in
            </Text>
          </View>
        </AppCard>
      ) : (
        <AppCard style={styles.nextRideCard}>
          <Text style={styles.nextRideAddress}>No upcoming ride right now.</Text>
          <Text style={styles.nextRideAction} onPress={() => router.push('/(rider)/schedule')}>
            Schedule
          </Text>
        </AppCard>
      )}

      <SectionHeader title="Today's Summary" />

      <View style={styles.metricGrid}>
        <MetricTile label="Today" value={data?.upcomingRideCount ?? 0} accent />
        <MetricTile label="Active" value={data?.activeRideCount ?? 0} />
        {data?.scopeType === 'GUARDIAN' ? (
          <MetricTile label="Linked" value={data?.linkedRiderCount ?? 0} />
        ) : (
          <MetricTile label="Messages" value={data?.unreadNotifications ?? 0} />
        )}
        <MetricTile label="Balance" value={`$${(data?.outstandingBalance ?? 0).toFixed(0)}`} />
      </View>

      <SectionHeader title="Quick Actions" />

      <View style={styles.quickActions}>
        <ActionRow
          icon="calendar-clock-outline"
          title="My Rides"
          description="View upcoming and past rides"
          onPress={() => router.push('/(rider)/rides')}
        />
        <ActionRow
          icon="plus-circle-outline"
          title="Schedule"
          description="Plan a new ride request"
          onPress={() => router.push('/(rider)/schedule')}
          tone="secondary"
        />
        <ActionRow
          icon="wallet-outline"
          title="Wallet"
          description="Invoices and payment history"
          onPress={() => router.push('/(rider)/billing')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerCard: {
    backgroundColor: PassengerRoleTheme.primary,
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  screenTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.white, opacity: 0.9 },
  name: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.white },
  onlineTag: {
    backgroundColor: '#16a34a',
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  signOut: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.white },
  nextRideCard: { gap: Spacing.xs },
  nextRideTime: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  nextRideAddress: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
  nextRideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  nextRideEta: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  nextRideAction: {
    backgroundColor: PassengerRoleTheme.primary,
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickActions: { gap: Spacing.sm },
});
