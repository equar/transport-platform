import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
          <Text style={styles.eyebrow}>Trip assignment</Text>
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
          <View style={styles.locationLabel}><MaterialCommunityIcons name="map-marker" size={18} color={Colors.primary} /><Text style={styles.addressLabel}>FROM</Text></View>
          <Text style={styles.addressText} numberOfLines={2}>{ride.pickupAddress ?? '—'}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.addressItem}>
          <View style={styles.locationLabel}><MaterialCommunityIcons name="map-marker" size={18} color={Colors.accent} /><Text style={styles.addressLabel}>TO</Text></View>
          <Text style={styles.addressText} numberOfLines={2}>{ride.dropoffAddress ?? '—'}</Text>
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
    borderRadius: 14,
    padding: Spacing.lg,
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
  eyebrow: { display: 'none',
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.secondaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  rideNumber: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  riderName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
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
  locationLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressItem: { flex: 1, gap: 2 },
  addressLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  addressText: {
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.primary,
  },
});
