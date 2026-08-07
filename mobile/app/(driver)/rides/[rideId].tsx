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
import NetInfo from '@react-native-community/netinfo';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

const STATUS_ACTIONS: Record<string, { action: DriverRideAction; label: string } | undefined> = {
  ASSIGNED: { action: 'en-route', label: 'Mark En Route' },
  DRIVER_EN_ROUTE: { action: 'arrived', label: 'Mark Arrived' },
  ARRIVED: { action: 'pickup-complete', label: 'Confirm Pickup' },
  PICKED_UP: { action: 'dropoff-complete', label: 'Confirm Drop Off' },
};

export default function DriverRideDetailPage() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { enqueue } = useOfflineQueue();

  const { data: ride, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-ride', rideId],
    queryFn: () => driverPortalApi.getRide(Number(rideId)),
    enabled: !!rideId,
  });

  const { mutate: performAction, isPending: actionPending } = useMutation({
    mutationFn: ({ action }: { action: DriverRideAction }) =>
      driverPortalApi.postRideAction(Number(rideId), action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-rides'] });
      qc.invalidateQueries({ queryKey: ['driver-ride', rideId] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  async function handleAction(action: DriverRideAction, label: string) {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      enqueue(Number(rideId), action);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Offline', `Action "${label}" will sync when you're back online.`);
      return;
    }
    Alert.alert('Confirm', `${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          performAction({ action });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  if (isLoading || !ride) return <LoadingState />;

  const nextAction = STATUS_ACTIONS[ride.status];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Back */}
      <Text style={styles.back} onPress={() => router.back()}>← Rides</Text>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.rideNumber}>{ride.rideNumber}</Text>
        <AppBadge status={ride.status} />
      </View>

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

      {/* Instructions */}
      {ride.specialInstructions ? (
        <Section title="Special Instructions">
          <Text style={styles.instructions}>{ride.specialInstructions}</Text>
        </Section>
      ) : null}

      {/* Action */}
      {nextAction && (
        <AppButton
          label={nextAction.label}
          onPress={() => handleAction(nextAction.action, nextAction.label)}
          loading={actionPending}
          fullWidth
          size="lg"
        />
      )}
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
  back: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  instructions: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
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
