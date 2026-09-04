import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, Pressable, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { driverPortalApi } from '@api/driverPortalApi';
import { runtimeApi } from '@api/runtimeApi';
import { LoadingState } from '@components/LoadingState';
import { AppCard } from '@components/ui';
import { useAuth } from '@auth/AuthContext';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

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

  const fullName =
    [session?.identity.firstName, session?.identity.lastName].filter(Boolean).join(' ') || 'Driver';
  const firstName = session?.identity.firstName?.trim() || 'Driver';
  const tenantName = tenantBranding?.displayName?.trim() || 'Transport Platform';
  const nextDispatch =
    upcomingRides?.items.find((item) =>
      ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(item.status),
    ) ?? null;

  const assignedCount = data?.assignedRides ?? 0;
  const completedCount = Math.max((data?.ridesToday ?? 0) - assignedCount, 0);
  const remainingCount = Math.max(assignedCount - completedCount, 0);
  const drivenMiles = Math.max((data?.ridesToday ?? 0) * 8, 0);
  const scheduleItems = (upcomingRides?.items ?? []).slice(0, 3);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const headerGreeting = new Date().getHours() < 12 ? 'Good morning' : 'Welcome back';

  function formatTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function statusTone(status: string) {
    if (status === 'ASSIGNED' || status === 'SCHEDULED') {
      return styles.badgePrimary;
    }
    if (status === 'COMPLETED') {
      return styles.badgeSuccess;
    }
    return styles.badgeNeutral;
  }

  function statusText(status: string) {
    return status.toLowerCase().replace(/_/g, ' ');
  }

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
            <Text style={styles.greeting}>{headerGreeting},</Text>
            <Text style={styles.identityName}>{fullName}</Text>
            <Text style={styles.identityMeta}>{tenantName}</Text>
          </View>
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.roundIconButton} onPress={() => router.push('/(driver)/notifications')}>
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
          <View style={styles.summaryDateWrap}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={DriverRoleTheme.primary} />
            <Text style={styles.summaryDate}>{dateLabel}</Text>
          </View>
        </View>
        <View style={styles.summaryStatsGrid}>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{assignedCount}</Text>
            <Text style={styles.summaryLabel}>Assigned Trips</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{remainingCount}</Text>
            <Text style={styles.summaryLabel}>Remaining Trips</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{drivenMiles} mi</Text>
            <Text style={styles.summaryLabel}>Total Driven</Text>
          </View>
          <View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
            <Text style={styles.summaryValue}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>Completed Trips</Text>
          </View>
        </View>
      </AppCard>

      {nextDispatch ? (
        <AppCard style={styles.assignmentCard} noBorder>
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentHeaderTitle}>Next Assignment</Text>
            <View style={styles.assignmentBadge}>
              <Text style={styles.assignmentBadgeText}>{statusText(nextDispatch.status)}</Text>
            </View>
          </View>
          <View style={styles.assignmentBody}>
            <Text style={styles.assignmentTime}>{formatTime(nextDispatch.scheduledPickupAt)}</Text>
            <Text style={styles.assignmentPoint} numberOfLines={1}>{nextDispatch.pickupAddress ?? 'Pickup address unavailable'}</Text>
            <Text style={styles.assignmentPoint} numberOfLines={1}>{nextDispatch.dropoffAddress ?? 'Drop-off address unavailable'}</Text>
            <Text style={styles.assignmentTripCode}>{nextDispatch.rideNumber}</Text>
          </View>
          <Pressable style={styles.assignmentAction} onPress={() => router.push(`/(driver)/rides/${nextDispatch.id}`)}>
            <Text style={styles.assignmentActionText}>View Assignment</Text>
          </Pressable>
        </AppCard>
      ) : (
        <AppCard style={styles.assignmentCard} noBorder>
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentHeaderTitle}>Next Assignment</Text>
            <View style={styles.assignmentBadge}>
              <Text style={styles.assignmentBadgeText}>none</Text>
            </View>
          </View>
          <View style={styles.assignmentBody}>
            <Text style={styles.assignmentTime}>No active assignment</Text>
            <Text style={styles.assignmentPoint}>You are all caught up for now.</Text>
          </View>
          <Pressable style={styles.assignmentAction} onPress={() => router.push('/(driver)/rides')}>
            <Text style={styles.assignmentActionText}>Open Dispatches</Text>
          </Pressable>
        </AppCard>
      )}

      <AppCard style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Today's Schedule</Text>
          <Pressable onPress={() => router.push('/(driver)/rides')}>
            <Text style={styles.scheduleViewAll}>View all</Text>
          </Pressable>
        </View>
        {scheduleItems.length > 0 ? (
          <View style={styles.scheduleList}>
            {scheduleItems.map((ride) => (
              <Pressable
                key={ride.id}
                style={styles.scheduleRow}
                onPress={() => router.push(`/(driver)/rides/${ride.id}`)}
              >
                <Text style={[styles.scheduleTime, isCompact && styles.scheduleTimeCompact]}>{formatTime(ride.scheduledPickupAt)}</Text>
                <View style={styles.scheduleDetailBlock}>
                  <Text style={styles.scheduleName} numberOfLines={1}>{ride.riderName}</Text>
                  <Text style={styles.scheduleLocation} numberOfLines={1}>{ride.pickupAddress ?? 'Pickup location unavailable'}</Text>
                </View>
                <View style={[styles.scheduleStatusBadge, statusTone(ride.status)]}>
                  <Text style={styles.scheduleStatusText}>{statusText(ride.status)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.emptySchedule}>No scheduled trips yet.</Text>
        )}
      </AppCard>
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
    backgroundColor: Colors.surfaceStrong,
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  heroRowCompact: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  identityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarShell: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: DriverRoleTheme.primaryStrong,
  },
  identityCopy: {
    flex: 1,
    gap: 1,
  },
  greeting: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: '#c6dcfb',
  },
  identityName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.white,
  },
  identityMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: '#c6dcfb',
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
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  summaryCard: {
    gap: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  summaryDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryDate: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeMd,
    color: DriverRoleTheme.primary,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: 0,
  },
  summaryStatCard: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  summaryStatCardFull: {
    flexBasis: '100%',
  },
  summaryValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  assignmentCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  assignmentHeaderTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  assignmentBadge: {
    backgroundColor: DriverRoleTheme.soft,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  assignmentBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.primary,
    textTransform: 'capitalize',
  },
  assignmentBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  assignmentTime: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  assignmentPoint: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
  assignmentTripCode: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: DriverRoleTheme.primary,
  },
  assignmentAction: {
    margin: Spacing.lg,
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  assignmentActionText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.white,
  },
  scheduleCard: {
    gap: Spacing.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  scheduleViewAll: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: DriverRoleTheme.primary,
  },
  scheduleList: {
    gap: Spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 58,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: Spacing.sm,
  },
  scheduleTime: {
    width: 70,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: DriverRoleTheme.primary,
  },
  scheduleTimeCompact: {
    width: 58,
    fontSize: Typography.sizeSm,
  },
  scheduleDetailBlock: {
    flex: 1,
    gap: 2,
  },
  scheduleName: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
  },
  scheduleLocation: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
  scheduleStatusBadge: {
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgePrimary: {
    backgroundColor: DriverRoleTheme.soft,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(47, 122, 82, 0.14)',
  },
  badgeNeutral: {
    backgroundColor: Colors.overlay,
  },
  scheduleStatusText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  emptySchedule: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
});
