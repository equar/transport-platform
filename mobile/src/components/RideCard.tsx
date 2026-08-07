import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AppBadge } from './ui';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';
import type { DriverPortalRideSummaryRecord } from '@api/driverPortalApi';
import { formatShortDateTime } from '@utils/formatDate';

interface RideCardProps {
  ride: DriverPortalRideSummaryRecord;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.rideNumber}>{ride.rideNumber}</Text>
        <AppBadge status={ride.status} />
      </View>
      <Text style={styles.riderName}>{ride.riderName}</Text>
      {ride.guardianName ? (
        <Text style={styles.meta}>Guardian: {ride.guardianName}</Text>
      ) : null}
      <View style={styles.addressRow}>
        <View style={styles.addressItem}>
          <Text style={styles.addressLabel}>FROM</Text>
          <Text style={styles.addressText} numberOfLines={1}>{ride.pickupAddress ?? '—'}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.addressItem}>
          <Text style={styles.addressLabel}>TO</Text>
          <Text style={styles.addressText} numberOfLines={1}>{ride.dropoffAddress ?? '—'}</Text>
        </View>
      </View>
      <Text style={styles.time}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  riderName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
  },
  meta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  addressItem: { flex: 1, gap: 2 },
  addressLabel: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  addressText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  arrow: {
    color: Colors.textSecondary,
    fontSize: Typography.sizeMd,
  },
  time: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
