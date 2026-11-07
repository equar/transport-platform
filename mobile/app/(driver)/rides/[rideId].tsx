import { SupportContact } from '@components/SupportContact';
import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { startTripTracking, stopTripTracking, useTrackingState } from '../../../src/tracking/activeTrip';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';
import { TripTrackingCard } from '@components/TripTrackingCard';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';
import { createIdempotencyKey } from '@utils/idempotencyKey';
import { useAuth } from '@auth/AuthContext';
import * as Linking from 'expo-linking';

const PRIMARY_STATUS_ACTIONS: Record<string, { action: DriverRideAction; label: string } | undefined> = {
  ASSIGNED: { action: 'driver-en-route', label: 'Mark En Route' },
  DRIVER_EN_ROUTE: { action: 'arrived', label: 'Mark Arrived' },
  ARRIVED: { action: 'picked-up', label: 'Confirm Pickup' },
  PICKED_UP: { action: 'dropped-off', label: 'Confirm Drop Off' },
  DROPPED_OFF: { action: 'complete', label: 'Complete Ride' },
};

const SECONDARY_STATUS_ACTIONS: Record<string, { action: DriverRideAction; label: string }[]> = {
  ASSIGNED: [{ action: 'no-show', label: 'Mark No-Show' }],
  DRIVER_EN_ROUTE: [{ action: 'failed', label: 'Report Failed Trip' }],
  ARRIVED: [
    { action: 'no-show', label: 'Mark No-Show' },
    { action: 'failed', label: 'Report Failed Trip' },
  ],
  PICKED_UP: [{ action: 'failed', label: 'Report Failed Trip' }],
  DROPPED_OFF: [{ action: 'failed', label: 'Report Failed Trip' }],
};

const TRACKABLE_STATUSES = new Set([
  'DRIVER_EN_ROUTE',
  'ARRIVED',
  'PICKED_UP',
]);

export default function DriverRideDetailPage() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const network = useNetInfo();
  const { enqueue, queue, conflicts, dismissConflict, retry } = useOfflineQueue();
  const { session } = useAuth();
  const locationPermissionAlertShownRef = React.useRef(false);
  const actionInFlightRef = React.useRef(false);

  const { data: ride, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['driver-ride', rideId],
    queryFn: () => driverPortalApi.getRide(Number(rideId)),
    enabled: !!rideId,
  });

  const {
    data: locationSnapshot,
    refetch: refetchLocationSnapshot,
    isRefetching: locationRefreshing,
  } = useQuery({
    queryKey: ['driver-ride-location', rideId],
    queryFn: () => driverPortalApi.getRideLocationSnapshot(Number(rideId)),
    enabled: !!rideId,
    refetchInterval: ride && TRACKABLE_STATUSES.has(ride.status) ? 30000 : false,
  });

  const { mutate: performAction, isPending: actionPending } = useMutation({
    mutationFn: ({ action, idempotencyKey }: { action: DriverRideAction; idempotencyKey: string }) =>
      driverPortalApi.postRideAction(Number(rideId), action, idempotencyKey),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['driver-rides'] });
      qc.invalidateQueries({ queryKey: ['driver-ride', rideId] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
    onSettled: () => {
      actionInFlightRef.current = false;
    },
  });

  async function handleAction(action: DriverRideAction, label: string) {
    if (actionInFlightRef.current) {
      return;
    }
    actionInFlightRef.current = true;
    let net;
    try {
      net = await NetInfo.fetch();
    } catch {
      actionInFlightRef.current = false;
      Alert.alert('Connection unavailable', 'Try the trip action again when your connection is available.');
      return;
    }
    if (!net.isConnected) {
      if (!session?.identity.tenantId || !ride) {
        actionInFlightRef.current = false;
        return;
      }
      enqueue(Number(rideId), action, {
        tenantId: session.identity.tenantId,
        userId: session.identity.id,
      }, ride.status);
      actionInFlightRef.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Offline', `Action "${label}" will sync when you're back online.`);
      return;
    }
    Alert.alert('Confirm', `${label}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          actionInFlightRef.current = false;
        },
      },
      {
        text: 'Confirm',
        onPress: () => {
          performAction({ action, idempotencyKey: createIdempotencyKey('driver-action') });

        },
      },
    ], {
      cancelable: true,
      onDismiss: () => {
        actionInFlightRef.current = false;
      },
    });
  }

  const { data: rideActions } = useQuery({ queryKey: ["ride-actions"], queryFn: driverPortalApi.getRideActions, staleTime: 3600000 });
  const tracking = useTrackingState();
  React.useEffect(() => {
    if (!ride || !session?.identity.tenantId) return;
    if (['DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'].includes(ride.status)) {
      void startTripTracking({ rideId: ride.id, tenantId: session.identity.tenantId, userId: session.identity.id })
        .catch(() => Alert.alert('Tracking unavailable', 'Check location permission in Settings.'));
    } else if (['COMPLETED', 'CANCELLED', 'FAILED', 'RIDER_NO_SHOW'].includes(ride.status)) {
      void stopTripTracking();
    }
  }, [ride?.status, rideId, session?.identity.id]);

  if (isLoading) return <LoadingState />;
  if (isError || !ride) return <View style={{ padding: 24, gap: 16 }}><Text>Trip unavailable. Check your connection and try again.</Text><AppButton label="Retry" onPress={() => void refetch()} /></View>;

  const primaryAction = rideActions?.[ride.status] ?? PRIMARY_STATUS_ACTIONS[ride.status];
  const secondaryActions = SECONDARY_STATUS_ACTIONS[ride.status] ?? [];
  const currentRideId = Number(rideId);
  const queuedAction = session?.identity.tenantId
    ? queue.find((item) => item.rideId === currentRideId
      && item.tenantId === session.identity.tenantId
      && item.userId === session.identity.id)
    : undefined;
  const actionConflict = session?.identity.tenantId
    ? conflicts.find((conflict) => conflict.rideId === currentRideId
      && conflict.tenantId === session.identity.tenantId
      && conflict.userId === session.identity.id)
    : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Current Trip</Text>
          <Text style={[styles.onlineBadge, { backgroundColor: network.isConnected ? "#15803d" : "#92400e" }]}>{network.isConnected ? "Online" : "Offline"}</Text>
        </View>
        <Text style={styles.rideNumberHero}>{ride.rideNumber}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroSchedule}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
          <AppBadge status={ride.status} />
        </View>
      </View>

      <Text accessibilityRole="text">{tracking.message}{tracking.lastSyncedAt ? ` • Last synced ${new Date(tracking.lastSyncedAt).toLocaleTimeString()}` : ""}</Text>
      <Text style={styles.back} onPress={() => router.back()}>← Dispatches</Text>

      {/* Action */}
      {(primaryAction || secondaryActions.length > 0) && (
        <Section title="Trip Actions">
          <View style={styles.primaryActionRow}>
            <View style={styles.primaryActionSlot}>
              <AppButton
                label="Navigate"
                variant="outlined"
                onPress={() => {
                  const target = ['PICKED_UP', 'DROPPED_OFF'].includes(ride.status) ? ride.dropoffAddress : ride.pickupAddress;
                  if (!target) { Alert.alert('Address unavailable', 'Contact dispatch for the destination.'); return; }
                  void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(target)}`);
                }}
                fullWidth
              />
            </View>
            {primaryAction ? (
              <View style={styles.primaryActionSlot}>
                <AppButton
                  label={primaryAction.label}
                  onPress={() => handleAction(primaryAction.action, primaryAction.label)}
                  loading={actionPending}
                  fullWidth
                  size="lg"
                />
              </View>
            ) : null}
          </View>
          {secondaryActions.length > 0 ? (
            <View style={styles.secondaryActionGroup}>
              {secondaryActions.map((item) => (
                <AppButton
                  key={item.action}
                  label={item.label}
                  onPress={() => handleAction(item.action, item.label)}
                  disabled={actionPending}
                  variant="outlined"
                  fullWidth
                />
              ))}
            </View>
          ) : null}
        </Section>
      )}
      {/* Rider */}
      <Section title="Rider">
        <Row label="Name" value={ride.riderName} />
        {ride.guardianName ? <Row label="Guardian" value={ride.guardianName} /> : null}
        {ride.wheelchairRequired ? <Row label="Needs" value="Wheelchair required" /> : null}
        {ride.escortRequired ? <Row label="Escort" value="Required" /> : null}
        {ride.companionCount > 0 ? (
          <Row label="Companions" value={String(ride.companionCount)} />
        ) : null}
      </Section>

      {/* Schedule */}
      <Section title="Schedule">
        <Row label="Pickup" value={formatShortDateTime(ride.scheduledPickupAt)} />
        {ride.scheduledDropoffAt ? (
          <Row label="Drop-off" value={formatShortDateTime(ride.scheduledDropoffAt)} />
        ) : null}
      </Section>

      {/* Addresses */}
      <Section title="Route">
        <Row label="From" value={ride.pickupAddress ?? '—'} />
        <Row label="To" value={ride.dropoffAddress ?? '—'} />
      </Section>

      <TripTrackingCard
        title="Live Route"
        snapshot={locationSnapshot ?? null}
        pickupAddress={ride.pickupAddress}
        dropoffAddress={ride.dropoffAddress}
        onRefresh={() => {
          void refetchLocationSnapshot();
        }}
        refreshing={locationRefreshing}
      />

      {/* Instructions */}
      {ride.specialInstructions ? (
        <Section title="Special Instructions">
          <Text style={styles.instructions}>{ride.specialInstructions}</Text>
        </Section>
      ) : null}

      {queuedAction ? (
        <View style={styles.queuedActionState}>
          <Text style={styles.queuedActionTitle}>Trip action queued</Text>
          <Text style={styles.queuedActionText}>
            {queuedAction.failed ? queuedAction.error : `${queuedAction.action.replace(/-/g, " ")} will sync when a connection is available.`}
          </Text>
          {queuedAction.failed ? <AppButton label="Retry sync" onPress={() => retry(queuedAction.id)} /> : null}
        </View>
      ) : null}

      {actionConflict ? (
        <View style={styles.conflictActionState}>
          <Text style={styles.conflictActionTitle}>Trip action needs review</Text>
          <Text style={styles.conflictActionText}>
            The trip is now {actionConflict.currentStatus.replace(/_/g, ' ').toLowerCase()}. Refresh the trip before choosing another action.
          </Text>
          <AppButton
            label="Dismiss"
            variant="outlined"
            onPress={() => dismissConflict(actionConflict.id)}
          />
        </View>
      ) : null}


      <SupportContact />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  heroCard: {
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.white,
  },
  onlineBadge: {
    backgroundColor: '#16a34a',
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  rideNumberHero: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.white,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSchedule: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  back: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.primary,
  },
  instructions: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  queuedActionState: {
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    backgroundColor: '#fffbeb',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  queuedActionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: '#92400e',
  },
  queuedActionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: '#92400e',
  },
  conflictActionState: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  conflictActionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: '#991b1b',
  },
  conflictActionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: '#991b1b',
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryActionSlot: {
    flex: 1,
  },
  secondaryActionGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});

const sectionStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 0,
  },
  title: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: '#fafafa',
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    width: 90,
  },
  value: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
    flex: 1,
  },
});
