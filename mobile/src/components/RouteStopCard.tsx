import React from 'react';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { StyleSheet, View, Text } from 'react-native';
import { AppBadge } from './ui';
import { Spacing, Typography } from '@theme/tokens';
import type { DriverPortalRouteStopRecord } from '@api/driverPortalApi';

interface RouteStopCardProps {
  stop: DriverPortalRouteStopRecord;
  isLast?: boolean;
}

export function RouteStopCard({ stop, isLast }: RouteStopCardProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={[styles.content, isLast && styles.contentLast]}>
        <View style={styles.row}>
          <Text style={styles.seq}>Stop {stop.stopSequence}</Text>
          <AppBadge status={stop.status} />
        </View>
        <Text style={styles.rider}>{stop.riderName}</Text>
        <Text style={styles.address} numberOfLines={2}>{stop.pickupAddress ?? '—'}</Text>
        <Text style={styles.address} numberOfLines={2}>{stop.dropoffAddress ?? '—'}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeline: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  contentLast: {
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seq: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.primary,
  },
  rider: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeLg,
    color: colors.textPrimary,
  },
  address: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
});
