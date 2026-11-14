import { isTrackableTrip } from '@utils/tripPresentation';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { RequestError } from '@components/RequestError';
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
import { useOfflineQueue, pendingTripStatus } from '@stores/offlineQueueStore';
import { AppBadge, AppButton, AppInput } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Spacing, Typography } from '@theme/tokens';
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

  DRIVER_EN_ROUTE: [{ action: 'failed', label: 'Report Failed Trip' }],
  ARRIVED: [
    { action: 'no-show', label: 'Mark No-Show' },
    { action: 'failed', label: 'Report Failed Trip' },
  ],
  PICKED_UP: [{ action: 'failed', label: 'Report Failed Trip' }],
  DROPPED_OFF: [{ action: 'failed', label: 'Report Failed Trip' }],
};

export default function DriverRideDetailPage() {
  const styles = useThemedStyles(createStyles);
  const colors = useBrandingColors();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const network = useNetInfo();
  const { enqueue, queue, conflicts, dismissConflict, retry, cancelTripActions } = useOfflineQueue();
  const { session } = useAuth();
  const actionInFlightRef = React.useRef(false);
  const [note, setNote] = React.useState('');

  const { data: serverRide, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['driver-ride', rideId],
    refetchInterval: query => query.state.data && !['COMPLETED', 'CANCELLED', 'FAILED', 'RIDER_NO_SHOW', 'MISSED'].includes(query.state.data.status) ? 15000 : false,
    queryFn: () => driverPortalApi.getRide(Number(rideId)),
    enabled: !!rideId,
  });

  const ride = serverRide && session?.identity.tenantId ? { ...serverRide,
    status: pendingTripStatus(serverRide.status, serverRide.id, { tenantId: session.identity.tenantId, userId: session.identity.id }, queue) as typeof serverRide.status,
  } : serverRide;
  const { data: earnings } = useQuery({
    queryKey: ['driver-payments'],
    queryFn: () => driverPortalApi.getPayments(),
    enabled: serverRide?.status === 'COMPLETED',
  });
  const rideEarnings = earnings?.entries.find(entry => entry.rideId === serverRide?.id && entry.entryType === 'EARNED');
  const pendingActions = queue.filter(item => item.rideId === Number(rideId) && item.userId === session?.identity.id && item.tenantId === session?.identity.tenantId);
  const blockedActions = pendingActions.some(item => item.failed) || conflicts.some(item => item.rideId === Number(rideId) && item.userId === session?.identity.id && item.tenantId === session?.identity.tenantId);

  const {
    data: locationSnapshot,
    refetch: refetchLocationSnapshot,
    isRefetching: locationRefreshing,
    isError: locationError,
  } = useQuery({
    queryKey: ['driver-ride-location', rideId],
    queryFn: () => driverPortalApi.getRideLocationSnapshot(Number(rideId)),
    enabled: !!ride && !isError && isTrackableTrip(ride.status),
    refetchInterval: ride && isTrackableTrip(ride.status) ? 30000 : false,
  });

  const { mutate: performAction, isPending: actionPending } = useMutation({
    mutationFn: ({ action, idempotencyKey }: { action: DriverRideAction; idempotencyKey: string }) =>
      driverPortalApi.postRideAction(Number(rideId), action, idempotencyKey, ride?.status),
    onSuccess: (updatedRide) => {
      qc.setQueryData(['driver-ride', rideId], updatedRide);
      if (!isTrackableTrip(updatedRide.status) && session?.identity.tenantId) void stopTripTracking({ rideId: updatedRide.id, tenantId: session.identity.tenantId, userId: session.identity.id });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries();
    },
    onError: (err: Error) => { void qc.invalidateQueries(); Alert.alert('Error', err.message); },
    onSettled: () => {
      actionInFlightRef.current = false;
    },
  });

  const saveNote = useMutation({
    mutationFn: () => driverPortalApi.addRideNote(Number(rideId), note.trim()),
    onSuccess: (updatedRide) => { setNote(''); qc.setQueryData(['driver-ride', rideId], updatedRide); void qc.invalidateQueries(); },
    onError: (err: Error) => Alert.alert('Note could not be saved', err.message),
  });

  async function handleAction(action: DriverRideAction, label: string) {
    if (actionInFlightRef.current || blockedActions) {
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
    if (!net.isConnected || net.isInternetReachable === false || pendingActions.length > 0) {
      if (!session?.identity.tenantId || !ride) {
        actionInFlightRef.current = false;
        return;
      }
      Alert.alert('Confirm offline action', `${label}? This update will sync when you reconnect.`, [
        { text: 'Cancel', style: 'cancel', onPress: () => { actionInFlightRef.current = false; } },
        { text: 'Confirm', onPress: () => {
          enqueue(Number(rideId), action, { tenantId: session.identity.tenantId!, userId: session.identity.id }, ride.status);
          if (['dropped-off', 'failed', 'no-show', 'complete'].includes(action)) {
            void stopTripTracking({ rideId: Number(rideId), tenantId: session.identity.tenantId!, userId: session.identity.id });
          }
          actionInFlightRef.current = false;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('Offline', `Action "${label}" will sync when you're back online.`);
        } },
      ], { cancelable: true, onDismiss: () => { actionInFlightRef.current = false; } });
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
    } else if (['DROPPED_OFF', 'COMPLETED', 'CANCELLED', 'FAILED', 'RIDER_NO_SHOW', 'MISSED'].includes(ride.status)) {
      void stopTripTracking({ rideId: ride.id, tenantId: session.identity.tenantId, userId: session.identity.id });
    }
  }, [ride?.status, rideId, session?.identity.id]);

  if (isLoading) return <LoadingState />;
  if (isError || !ride) return <RequestError onRetry={() => void refetch()} />;

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
          <Text style={styles.heroTitle}>{ride.journeyLeg === "RETURN" ? "Return journey" : ride.journeyLeg === "OUTBOUND" ? "Outbound journey" : "Current trip"}</Text>
          <Text style={[styles.onlineBadge, { backgroundColor: network.isConnected ? colors.success : colors.warning }]}>{network.isConnected ? "Online" : "Offline"}</Text>
        </View>
        <Text style={styles.rideNumberHero}>{ride.rideNumber}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroSchedule}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
          <AppBadge status={ride.status} />
          {pendingActions.length > 0 ? <Text style={styles.instructions}>Pending on this device • dispatch last confirmed {serverRide?.status.replace(/_/g, " ")}</Text> : null}
        </View>
      </View>

      {ride.status === 'COMPLETED' ? (
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Trip earnings</Text>
          {rideEarnings ? (
            <>
              <Text style={styles.earningsAmount}>
                {rideEarnings.amount == null
                  ? 'Amount not calculated yet'
                  : new Intl.NumberFormat('en-US', { style: 'currency', currency: rideEarnings.currency }).format(rideEarnings.amount)}
              </Text>
              <Text style={styles.instructions}>
                {rideEarnings.status === 'PENDING_CALCULATION'
                  ? 'Awaiting the issued ride charge or the tenant earnings rate.'
                  : rideEarnings.status === 'PENDING_REVIEW'
                    ? 'Calculated and awaiting tenant admin approval.'
                    : 'Approved by your tenant administrator.'}
              </Text>
            </>
          ) : (
            <Text style={styles.instructions}>
              Earnings will appear when a ride charge is issued and the tenant rate is available.
            </Text>
          )}
        </View>
      ) : null}

      {isTrackableTrip(ride.status) && (<Text accessibilityRole="text" style={{ fontFamily: Typography.fontBody, color: colors.textSecondary, lineHeight: 22 }}>{tracking.rideId === ride.id ? tracking.message : 'Tracking is off for this trip'}{tracking.rideId === ride.id && tracking.lastSyncedAt ? ` • Last synced ${new Date(tracking.lastSyncedAt).toLocaleTimeString()}` : ""}</Text>)}
      <Text accessibilityRole="button" style={[styles.back, { minHeight: 48, paddingVertical: 12 }]} onPress={() => router.back()}>← Dispatches</Text>

      {ride.linkedRideId ? <Text style={styles.instructions}>This is the {ride.journeyLeg?.toLowerCase()} leg. The paired journey has a separate assignment and completion status. Contact dispatch for changes.</Text> : null}
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
                  void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(target)}`).catch(() => Alert.alert('Maps unavailable', 'Open your maps app or contact dispatch for directions.'));
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
                  disabled={blockedActions}
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
                  disabled={actionPending || blockedActions}
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

      {isTrackableTrip(ride.status) && (
<TripTrackingCard
        title="Live Route"
        snapshot={locationSnapshot ?? null}
  rideStatus={ride.status}
        error={locationError}
        pickupAddress={ride.pickupAddress}
        dropoffAddress={ride.dropoffAddress}
        onRefresh={() => {
          void refetchLocationSnapshot();
        }}
        refreshing={locationRefreshing}
      />
      )}

      {/* Instructions */}
      {ride.specialInstructions ? (
        <Section title="Special Instructions">
          <Text style={styles.instructions}>{ride.specialInstructions}</Text>
        </Section>
      ) : null}

      <Section title="Trip Notes">
        {ride.operationalNotes ? <Text style={styles.instructions}>{ride.operationalNotes}</Text> : null}
        <AppInput label="Trip note" value={note} onChangeText={setNote} multiline numberOfLines={3} maxLength={2000} showCount editable={!saveNote.isPending} />
        <AppButton label="Save note" onPress={() => saveNote.mutate()} loading={saveNote.isPending} disabled={!note.trim() || network.isConnected === false || network.isInternetReachable === false} />
        {network.isConnected === false || network.isInternetReachable === false ? <Text style={styles.instructions}>Connect to save a trip note.</Text> : null}
      </Section>

      {queuedAction ? (
        <View style={styles.queuedActionState}>
          <Text style={styles.queuedActionTitle}>Trip action queued</Text>
          <Text style={styles.queuedActionText}>
            {queuedAction.failed ? queuedAction.error : `${queuedAction.action.replace(/-/g, " ")} will sync when a connection is available.`}
          </Text>
          {queuedAction.failed ? <AppButton label="Retry sync" onPress={() => retry(queuedAction.id)} /> : null}
          <AppButton label="Discard unsent trip updates" variant="ghost" onPress={() => Alert.alert('Discard unsent updates?', 'These milestones will not reach dispatch. Contact dispatch to reconcile what happened before discarding.', [
            { text: 'Keep updates', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => { if (session?.identity.tenantId) cancelTripActions(Number(rideId), { tenantId: session.identity.tenantId, userId: session.identity.id }); void refetch(); } },
          ])} />
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
  const sectionStyles = useThemedStyles(createSectionStyles);
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const rowStyles = useThemedStyles(createRowStyles);
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 14,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  earningsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  earningsTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.textPrimary,
  },
  earningsAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: colors.textPrimary,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.textPrimary,
  },
  onlineBadge: {
    backgroundColor: colors.success,
    color: colors.white,
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  rideNumberHero: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXxl,
    color: colors.textPrimary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSchedule: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  back: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: colors.primary,
  },
  instructions: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeMd,
    color: colors.textPrimary,
  },
  queuedActionState: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  queuedActionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.warning,
  },
  queuedActionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.warning,
  },
  conflictActionState: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    backgroundColor: colors.errorSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  conflictActionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.error,
  },
  conflictActionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.error,
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

const createSectionStyles = (colors: BrandColors) => StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    gap: 0,
    backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surfaceMuted,
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
});

const createRowStyles = (colors: BrandColors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    width: 90,
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
    flex: 1,
  },
});
