import React from 'react';
import { tripStatusLabel } from '@utils/tripPresentation';
import { StyleSheet, View, Text, ViewStyle, type ColorValue } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';

type StatusVariant =
  | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'COMPLETED'
  | 'CANCELLED' | 'ASSIGNED' | 'DRIVER_EN_ROUTE' | 'ARRIVED' | 'PICKED_UP'
  | 'DROPPED_OFF' | 'SCHEDULED' | 'REQUESTED' | 'DRAFT' | 'MISSED'
  | 'FAILED' | 'TERMINATED' | 'ON_LEAVE' | 'IN_PROGRESS' | 'READY'
  | 'PLANNED' | string;

const colorMap: Record<string, { bg: ColorValue; text: ColorValue }> = {
  VERIFIED: { bg: Colors.successSoft, text: Colors.statusActive },
  ACTIVE: { bg: Colors.successSoft, text: Colors.statusActive },
  READY: { bg: Colors.successSoft, text: Colors.statusActive },
  COMPLETED: { bg: Colors.primarySoft, text: Colors.statusCompleted },
  DROPPED_OFF: { bg: Colors.primarySoft, text: Colors.statusCompleted },
  ASSIGNED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  DRIVER_EN_ROUTE: { bg: Colors.primarySoft, text: Colors.statusEnRoute },
  ARRIVED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PICKED_UP: { bg: Colors.primarySoft, text: Colors.info },
  IN_PROGRESS: { bg: Colors.primarySoft, text: Colors.info },
  SCHEDULED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PLANNED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PENDING: { bg: Colors.warningSoft, text: Colors.statusPending },
  REQUESTED: { bg: Colors.warningSoft, text: Colors.statusPending },
  SUSPENDED: { bg: Colors.errorSoft, text: Colors.statusSuspended },
  FAILED: { bg: Colors.errorSoft, text: Colors.statusSuspended },
  CANCELLED: { bg: Colors.canvas, text: Colors.statusCancelled },
  INACTIVE: { bg: Colors.canvas, text: Colors.statusInactive },
  DRAFT: { bg: Colors.canvas, text: Colors.statusInactive },
  MISSED: { bg: Colors.errorSoft, text: Colors.statusSuspended },
  TERMINATED: { bg: Colors.errorSoft, text: Colors.statusSuspended },
  ON_LEAVE: { bg: Colors.warningSoft, text: Colors.statusPending },
};

function getColor(status: string) {
  return colorMap[status] ?? { bg: Colors.surfaceMuted, text: Colors.textSecondary };
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
  const { bg, text } = getColor(status);
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
