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
  ACTIVE: { bg: '#e8f5e9', text: Colors.statusActive },
  READY: { bg: '#e8f5e9', text: Colors.statusActive },
  COMPLETED: { bg: '#e3f2fd', text: Colors.statusCompleted },
  DROPPED_OFF: { bg: '#e3f2fd', text: Colors.statusCompleted },
  ASSIGNED: { bg: '#ede7f6', text: Colors.statusEnRoute },
  DRIVER_EN_ROUTE: { bg: '#f3e5f5', text: Colors.statusEnRoute },
  ARRIVED: { bg: '#e8eaf6', text: '#3949ab' },
  PICKED_UP: { bg: '#e1f5fe', text: Colors.info },
  IN_PROGRESS: { bg: '#e1f5fe', text: Colors.info },
  SCHEDULED: { bg: '#e1f5fe', text: Colors.info },
  PLANNED: { bg: '#e1f5fe', text: Colors.info },
  PENDING: { bg: '#fff3e0', text: Colors.statusPending },
  REQUESTED: { bg: '#fff3e0', text: Colors.statusPending },
  SUSPENDED: { bg: '#ffebee', text: Colors.statusSuspended },
  FAILED: { bg: '#ffebee', text: Colors.statusSuspended },
  CANCELLED: { bg: '#f5f5f5', text: Colors.statusCancelled },
  INACTIVE: { bg: '#f5f5f5', text: Colors.statusInactive },
  DRAFT: { bg: '#f5f5f5', text: Colors.statusInactive },
  MISSED: { bg: '#ffebee', text: Colors.statusSuspended },
  TERMINATED: { bg: '#ffebee', text: Colors.statusSuspended },
  ON_LEAVE: { bg: '#fff8e1', text: '#f57f17' },
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
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
