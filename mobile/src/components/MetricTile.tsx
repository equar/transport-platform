import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@theme/tokens';

interface MetricTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
  warning?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function MetricTile({ label, value, accent, warning, icon }: MetricTileProps) {
  const valueColor = warning ? Colors.error : accent ? Colors.primary : Colors.textPrimary;
  return (
    <View style={styles.tile}>
      {icon ? <MaterialCommunityIcons name={icon} size={26} color={valueColor} /> : <View style={[styles.accentBar, accent && styles.accentBarActive, warning && styles.accentBarWarning]} />}
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 120,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: Colors.canvas,
  },
  accentBarActive: {
    backgroundColor: Colors.primary,
  },
  accentBarWarning: {
    backgroundColor: Colors.error,
  },
  value: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxxl,
    color: Colors.textPrimary,
  },
  label: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
