import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AppBadge } from './ui';
import { Colors, Shadow, Spacing, Typography } from '@theme/tokens';
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
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Active trip</Text>
          <Text style={styles.rideNumber}>{ride.rideNumber}</Text>
        </View>
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
      <View style={styles.footerRow}>
        <Text style={styles.time}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
        <Text style={styles.footerLink}>Open trip</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBlock: {
    gap: 2,
  },
  eyebrow: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.secondaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  rideNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  riderName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeXl,
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
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  time: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.primary,
  },
});
