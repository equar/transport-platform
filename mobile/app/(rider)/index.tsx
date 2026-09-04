import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, Pressable, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { riderPortalApi } from '@api/riderPortalApi';
import { LoadingState } from '@components/LoadingState';
import { AppCard } from '@components/ui';
import { useAuth } from '@auth/AuthContext';
import { ActionRow } from '@components/ActionRow';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime, timeUntil } from '@utils/formatDate';

export default function RiderDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

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
  const firstName = session?.identity.firstName?.trim() || 'Rider';
  const nextRide = rides?.items.find((ride) => !['COMPLETED', 'CANCELLED', 'MISSED', 'FAILED'].includes(ride.status)) ?? null;
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={[styles.heroRow, isCompact && styles.heroRowCompact]}>
        <View style={styles.identityRow}>
          <View style={styles.avatarShell}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.greeting}>Ready to ride,</Text>
            <Text style={styles.identityName}>{name}</Text>
          </View>
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.roundIconButton} onPress={() => router.push('/(rider)/notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.roundIconButton} onPress={() => void signOut()}>
            <MaterialCommunityIcons name="logout" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <Text style={styles.summaryDate}>{dateLabel}</Text>
        </View>
        <View style={styles.summaryStatsGrid}>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{data?.upcomingRideCount ?? 0}</Text>
            <Text style={styles.summaryLabel}>Scheduled</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{data?.activeRideCount ?? 0}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{data?.unreadNotifications ?? 0}</Text>
            <Text style={styles.summaryLabel}>Messages</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>${(data?.outstandingBalance ?? 0).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Balance</Text>
          </View>
        </View>
      </AppCard>

      {nextRide ? (
        <AppCard style={styles.nextRideCard}>
          <View style={styles.nextRideHeader}>
            <Text style={styles.nextRideHeaderTitle}>Next Ride</Text>
            <Text style={styles.nextRideEta}>Pickup in {timeUntil(nextRide.scheduledPickupAt)}</Text>
          </View>
          <Text style={styles.nextRideTime}>{formatShortDateTime(nextRide.scheduledPickupAt)}</Text>
          <Text style={styles.nextRideAddress}>{nextRide.pickupAddress ?? 'Pickup pending'}</Text>
          <Text style={styles.nextRideAddress}>{nextRide.dropoffAddress ?? 'Drop-off pending'}</Text>
          <Pressable style={styles.nextRideActionButton} onPress={() => router.push(`/(rider)/rides/${nextRide.id}`)}>
            <Text style={styles.nextRideActionText}>Check In</Text>
          </Pressable>
        </AppCard>
      ) : (
        <AppCard style={styles.nextRideCard}>
          <Text style={styles.nextRideHeaderTitle}>Next Ride</Text>
          <Text style={styles.nextRideAddress}>No upcoming ride right now.</Text>
          <Pressable style={styles.nextRideActionButton} onPress={() => router.push('/(rider)/schedule')}>
            <Text style={styles.nextRideActionText}>Schedule Ride</Text>
          </Pressable>
        </AppCard>
      )}

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
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  heroRowCompact: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatarShell: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: PassengerRoleTheme.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: PassengerRoleTheme.primary,
  },
  identityCopy: { gap: 2 },
  greeting: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
  identityName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roundIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  summaryCard: { gap: Spacing.md },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  summaryDate: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: PassengerRoleTheme.primary,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  summaryStatCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.sm,
    gap: 2,
  },
  summaryStatCardFull: {
    width: '100%',
  },
  summaryValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  nextRideCard: { gap: Spacing.xs },
  nextRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  nextRideHeaderTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  nextRideTime: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  nextRideAddress: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  nextRideEta: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: PassengerRoleTheme.primary,
  },
  nextRideActionButton: {
    marginTop: Spacing.sm,
    backgroundColor: PassengerRoleTheme.primary,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  nextRideActionText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.white,
  },
  quickActions: { gap: Spacing.sm },
});
