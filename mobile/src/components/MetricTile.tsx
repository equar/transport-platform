import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

interface MetricTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
  warning?: boolean;
}

export function MetricTile({ label, value, accent, warning }: MetricTileProps) {
  const valueColor = warning ? Colors.error : accent ? Colors.primary : Colors.textPrimary;
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.xs,
    minWidth: 100,
    minHeight: 112,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  value: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  label: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textAlign: 'left',
  },
});
