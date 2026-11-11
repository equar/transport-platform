import React from 'react';
import { tripStatusLabel } from '@utils/tripPresentation';
import { StyleSheet, View, Text, ViewStyle, type ColorValue } from 'react-native';
import { Radius, Spacing, Typography } from '@theme/tokens';
import { useBrandingColors } from '@theme/BrandingContext';

type StatusVariant =
  | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'COMPLETED'
  | 'CANCELLED' | 'ASSIGNED' | 'DRIVER_EN_ROUTE' | 'ARRIVED' | 'PICKED_UP'
  | 'DROPPED_OFF' | 'SCHEDULED' | 'REQUESTED' | 'DRAFT' | 'MISSED'
  | 'FAILED' | 'TERMINATED' | 'ON_LEAVE' | 'IN_PROGRESS' | 'READY'
  | 'PLANNED' | string;

function getColor(status: string, colors: ReturnType<typeof useBrandingColors>): { bg: ColorValue; text: ColorValue } {
  const colorMap: Record<string, { bg: ColorValue; text: ColorValue }> = {
    VERIFIED: { bg: colors.successSoft, text: colors.statusActive },
    ACTIVE: { bg: colors.successSoft, text: colors.statusActive },
    READY: { bg: colors.successSoft, text: colors.statusActive },
    COMPLETED: { bg: colors.primarySoft, text: colors.statusCompleted },
    DROPPED_OFF: { bg: colors.primarySoft, text: colors.statusCompleted },
    ASSIGNED: { bg: colors.primarySoft, text: colors.primaryDark },
    DRIVER_EN_ROUTE: { bg: colors.primarySoft, text: colors.statusEnRoute },
    ARRIVED: { bg: colors.primarySoft, text: colors.primaryDark },
    PICKED_UP: { bg: colors.primarySoft, text: colors.info },
    IN_PROGRESS: { bg: colors.primarySoft, text: colors.info },
    SCHEDULED: { bg: colors.primarySoft, text: colors.primaryDark },
    PLANNED: { bg: colors.primarySoft, text: colors.primaryDark },
    PENDING: { bg: colors.warningSoft, text: colors.statusPending },
    REQUESTED: { bg: colors.warningSoft, text: colors.statusPending },
    SUSPENDED: { bg: colors.errorSoft, text: colors.statusSuspended },
    FAILED: { bg: colors.errorSoft, text: colors.statusSuspended },
    CANCELLED: { bg: colors.canvas, text: colors.statusCancelled },
    INACTIVE: { bg: colors.canvas, text: colors.statusInactive },
    DRAFT: { bg: colors.canvas, text: colors.statusInactive },
    MISSED: { bg: colors.errorSoft, text: colors.statusSuspended },
    TERMINATED: { bg: colors.errorSoft, text: colors.statusSuspended },
    ON_LEAVE: { bg: colors.warningSoft, text: colors.statusPending },
  };
  return colorMap[status] ?? { bg: colors.surfaceMuted, text: colors.textSecondary };
}

function formatLabel(status: string) {
  return tripStatusLabel(status);
}

interface AppBadgeProps {
  status: StatusVariant;
  label?: string;
  style?: ViewStyle;
}

export function AppBadge({ status, label, style }: AppBadgeProps) {
  const colors = useBrandingColors();
  const { bg, text } = getColor(status, colors);
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: Radius.chip }, style]}>
      <Text style={[styles.text, { color: text }]}>{label ?? formatLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    textTransform: 'capitalize',
  },
});
