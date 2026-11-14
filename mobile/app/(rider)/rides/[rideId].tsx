import { isFinishedTrip, isTrackableTrip } from '@utils/tripPresentation';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
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
import { Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

const CANCELLABLE = new Set(['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'ASSIGNED']);

export default function RiderRideDetailPage() {
  const styles = useThemedStyles(createStyles);
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [reason, setReason] = React.useState('');

  const { data: ride, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['rider-ride', rideId],
    refetchInterval: query => query.state.data && !isFinishedTrip(query.state.data.status) ? 15000 : false,
    queryFn: () => riderPortalApi.getRide(Number(rideId)),
    enabled: !!rideId,
  });

  const {
    data: locationSnapshot,
    refetch: refetchLocationSnapshot,
    isRefetching: locationRefreshing,
    isError: locationError,
  } = useQuery({
    queryKey: ['rider-ride-location', rideId],
    queryFn: () => riderPortalApi.getRideLocationSnapshot(Number(rideId)),
    enabled: !!ride && !isError && isTrackableTrip(ride.status),
    refetchInterval: ride && isTrackableTrip(ride.status) ? 30000 : false,
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
        {ride.linkedRideId ? <AppButton label={`View ${ride.journeyLeg === 'RETURN' ? 'outbound' : 'return'} journey`} variant="outlined" onPress={() => router.push(`/(rider)/rides/${ride.linkedRideId}` as never)} /> : null}
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

      {isTrackableTrip(ride.status) && (
<TripTrackingCard
        title="Trip Tracking"
        snapshot={isTrackableTrip(ride.status) ? locationSnapshot ?? null : null}
        error={locationError && isTrackableTrip(ride.status)}
        pickupAddress={ride.pickupAddress}
        dropoffAddress={ride.dropoffAddress}
        onRefresh={() => {
          void refetchLocationSnapshot();
        }}
        refreshing={locationRefreshing}
      />
      )}

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
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  heroRide: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: colors.textPrimary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  back: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.primary },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeXs, color: colors.textSecondary, letterSpacing: 0.5, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surfaceMuted },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionSlot: {
    flex: 1,
  },
});

const createRowStyles = (colors: BrandColors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: colors.textSecondary, width: 90 },
  value: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary, flex: 1 },
});
