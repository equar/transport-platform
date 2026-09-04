import React from 'react';
import { StyleSheet, ScrollView, View, Text, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { TripTrackingCard } from '@components/TripTrackingCard';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';
import * as Linking from 'expo-linking';

const CANCELLABLE = new Set(['REQUESTED', 'PENDING_REVIEW', 'SCHEDULED', 'ASSIGNED']);
const TRACKABLE_STATUSES = new Set(['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'DROPPED_OFF']);

export default function RiderRideDetailPage() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: ride, isLoading, refetch, isRefetching } = useQuery({
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
    mutationFn: () => riderPortalApi.cancelRide(Number(rideId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-rides'] });
      qc.invalidateQueries({ queryKey: ['rider-ride', rideId] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleCancel() {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'Keep Ride', style: 'cancel' },
      { text: 'Cancel Ride', style: 'destructive', onPress: () => cancel() },
    ]);
  }

  if (isLoading || !ride) return <LoadingState />;

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

      <Text style={styles.back} onPress={() => router.back()}>← My Rides</Text>

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

      {canCancel && (
        <View style={styles.actionRow}>
          <View style={styles.actionSlot}>
            <AppButton
              label="Call"
              variant="outlined"
              onPress={() => {
                const fallback = ride.guardianName ? '+1555010000' : '+1555010001';
                void Linking.openURL(`tel:${fallback}`);
              }}
              fullWidth
            />
          </View>
          <View style={styles.actionSlot}>
            <AppButton
              label="Cancel Ride"
              onPress={handleCancel}
              loading={isPending}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      )}
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
    backgroundColor: PassengerRoleTheme.primary,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  heroRide: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTime: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  back: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.primary },
  section: { borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeXs, color: Colors.textSecondary, letterSpacing: 0.5, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: '#fafafa' },
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
  label: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 90 },
  value: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
