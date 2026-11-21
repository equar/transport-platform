import React from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { AppBadge } from './ui';
import { Shadow, Spacing, Typography } from '@theme/tokens';
import type { DriverPortalRideSummaryRecord } from '@api/driverPortalApi';
import { formatShortDateTime } from '@utils/formatDate';

interface RideCardProps {
  ride: DriverPortalRideSummaryRecord;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const styles = useThemedStyles(createStyles);
  const { width, fontScale } = useWindowDimensions();
  const stackedHeader = width < 380 || fontScale > 1.25;
  const colors = useBrandingColors();
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityHint="Opens trip details" style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.row, stackedHeader && styles.stackedRow]}>
        <View style={[styles.headerBlock, stackedHeader && styles.stackedHeader]}>
          <Text style={styles.rideNumber}>{ride.rideNumber}{ride.journeyLeg ? ` • ${ride.journeyLeg === "RETURN" ? "Return" : "Outbound"}` : ""}</Text>
        </View>
        <AppBadge status={ride.status} />
      </View>
      <Text style={styles.riderName}>{ride.riderName}</Text>
      {ride.guardianName ? (
        <Text style={styles.meta}>Guardian: {ride.guardianName}</Text>
      ) : null}
      <View style={[styles.addressRow, stackedHeader && styles.stackedAddresses]}>
        <View style={[styles.addressItem, stackedHeader && styles.stackedAddress]}>
          <View style={styles.locationLabel}><MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} /><Text style={styles.addressLabel}>FROM</Text></View>
          <Text style={styles.addressText} numberOfLines={stackedHeader ? undefined : 2}>{ride.pickupAddress ?? '—'}</Text>
        </View>
        <Text style={[styles.arrow, stackedHeader && { alignSelf: 'center' }]}>{stackedHeader ? '↓' : '→'}</Text>
        <View style={[styles.addressItem, stackedHeader && styles.stackedAddress]}>
          <View style={styles.locationLabel}><MaterialCommunityIcons name="map-marker" size={18} color={colors.accent} /><Text style={styles.addressLabel}>TO</Text></View>
          <Text style={styles.addressText} numberOfLines={stackedHeader ? undefined : 2}>{ride.dropoffAddress ?? '—'}</Text>
        </View>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.time}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
        <Text style={styles.footerLink}>Open trip</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: colors.divider,
    borderRadius: 14,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stackedRow: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' },
  stackedHeader: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' },
  headerBlock: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    minWidth: 0,
    gap: 2,
  },
  rideNumber: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeLg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  riderName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeXl,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  locationLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressItem: { flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 2 },
  stackedAddresses: { flexDirection: 'column', alignItems: 'stretch' },
  stackedAddress: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  addressLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  addressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: Typography.sizeMd,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  time: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: colors.primary,
  },
});
