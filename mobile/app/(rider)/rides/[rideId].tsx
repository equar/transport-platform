import { SupportContact } from '@components/SupportContact';
import { RequestError } from '@components/RequestError';
import React from 'react';
import { StyleSheet, ScrollView, View, Text, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { TripTrackingCard } from '@components/TripTrackingCard';
import { AppBadge, AppButton, AppInput } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

const CANCELLABLE = new Set(['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'ASSIGNED']);
const TRACKABLE_STATUSES = new Set(['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'DROPPED_OFF']);

export default function RiderRideDetailPage() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [reason, setReason] = React.useState('');

  const { data: ride, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['rider-ride', rideId],
    queryFn: () => riderPortalApi.getRide(Number(rideId)),
    enabled: !!rideId,
  });

  const {
    data: locationSnapshot,
    refetch: refetchLocationSnapshot,
    isRefetching: locationRefreshing,
  } = useQuery({
    queryKey: ['rider-ride-location', rideId],
    queryFn: () => riderPortalApi.getRideLocationSnapshot(Number(rideId)),
    enabled: !!rideId,
    refetchInterval: ride && TRACKABLE_STATUSES.has(ride.status) ? 30000 : false,
  });

  const { mutate: cancel, isPending } = useMutation({
    mutationFn: () => riderPortalApi.cancelRide(Number(rideId), reason.trim()),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleCancel() {
    if (!reason.trim()) { Alert.alert('Reason required', 'Enter a cancellation reason.'); return; }
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'Keep Ride', style: 'cancel' },
      { text: 'Cancel Ride', style: 'destructive', onPress: () => cancel() },
    ]);
  }

  if (isLoading) return <LoadingState />;
  if (isError || !ride) return <RequestError onRetry={() => void refetch()} />;

  const canCancel = CANCELLABLE.has(ride.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Trip Tracking</Text>
        <Text style={styles.heroRide}>{ride.rideNumber}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroTime}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
          <AppBadge status={ride.status} />
        </View>
      </View>

      <Text accessibilityRole="button" style={[styles.back, { minHeight: 48, paddingVertical: 12 }]} onPress={() => router.back()}>← My Rides</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SCHEDULE</Text>
        <Row label="Pickup" value={formatShortDateTime(ride.scheduledPickupAt)} />
        {ride.scheduledDropoffAt ? (
          <Row label="Drop-off" value={formatShortDateTime(ride.scheduledDropoffAt)} />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ROUTE</Text>
        <Row label="From" value={ride.pickupAddress ?? '—'} />
        <Row label="To" value={ride.dropoffAddress ?? '—'} />
      </View>

      <TripTrackingCard
        title="Trip Tracking"
        snapshot={locationSnapshot ?? null}
        pickupAddress={ride.pickupAddress}
        dropoffAddress={ride.dropoffAddress}
        onRefresh={() => {
          void refetchLocationSnapshot();
        }}
        refreshing={locationRefreshing}
      />

      {ride.guardianName ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GUARDIAN</Text>
          <Row label="Name" value={ride.guardianName} />
        </View>
      ) : null}

      {canCancel ? <AppInput label="Cancellation reason" value={reason} onChangeText={setReason} maxLength={1000} /> : null}
      {canCancel && (
        <View style={styles.actionRow}>
          <View style={styles.actionSlot}>
            <AppButton
              label="Cancel ride"
              variant="destructive"
              onPress={handleCancel}
              loading={isPending}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      )}
      <SupportContact />
    </ScrollView>
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
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  heroRide: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  back: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: Colors.primary },
  section: { borderWidth: 1, borderColor: Colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeXs, color: Colors.textSecondary, letterSpacing: 0.5, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.surfaceMuted },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionSlot: {
    flex: 1,
  },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 90 },
  value: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
