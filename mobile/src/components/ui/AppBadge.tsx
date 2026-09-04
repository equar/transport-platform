import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';

type StatusVariant =
  | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'COMPLETED'
  | 'CANCELLED' | 'ASSIGNED' | 'DRIVER_EN_ROUTE' | 'ARRIVED' | 'PICKED_UP'
  | 'DROPPED_OFF' | 'SCHEDULED' | 'REQUESTED' | 'DRAFT' | 'MISSED'
  | 'FAILED' | 'TERMINATED' | 'ON_LEAVE' | 'IN_PROGRESS' | 'READY'
  | 'PLANNED' | string;

const colorMap: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: '#e7f4ec', text: Colors.statusActive },
  READY: { bg: '#e7f4ec', text: Colors.statusActive },
  COMPLETED: { bg: '#e8f0fb', text: Colors.statusCompleted },
  DROPPED_OFF: { bg: '#e8f0fb', text: Colors.statusCompleted },
  ASSIGNED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  DRIVER_EN_ROUTE: { bg: Colors.primarySoft, text: Colors.statusEnRoute },
  ARRIVED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PICKED_UP: { bg: '#e4f3ff', text: Colors.info },
  IN_PROGRESS: { bg: '#e4f3ff', text: Colors.info },
  SCHEDULED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PLANNED: { bg: Colors.primarySoft, text: Colors.primaryDark },
  PENDING: { bg: '#fdf0dd', text: Colors.statusPending },
  REQUESTED: { bg: '#fdf0dd', text: Colors.statusPending },
  SUSPENDED: { bg: '#fde9e8', text: Colors.statusSuspended },
  FAILED: { bg: '#fde9e8', text: Colors.statusSuspended },
  CANCELLED: { bg: '#eef1f3', text: Colors.statusCancelled },
  INACTIVE: { bg: '#eef1f3', text: Colors.statusInactive },
  DRAFT: { bg: '#eef1f3', text: Colors.statusInactive },
  MISSED: { bg: '#fde9e8', text: Colors.statusSuspended },
  TERMINATED: { bg: '#fde9e8', text: Colors.statusSuspended },
  ON_LEAVE: { bg: '#fdf5de', text: '#a16207' },
};

function getColor(status: string) {
  return colorMap[status] ?? { bg: '#f5f5f5', text: Colors.textSecondary };
}

function formatLabel(status: string) {
  return status.replace(/_/g, ' ');
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
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    textTransform: 'capitalize',
  },
});
