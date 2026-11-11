import React from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { Spacing, Typography } from '@theme/tokens';

interface MetricTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
  warning?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function MetricTile({ label, value, accent, warning, icon }: MetricTileProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useBrandingColors();
  const valueColor = warning ? colors.error : accent ? colors.primary : colors.textPrimary;
  return (
    <View style={styles.tile}>
      {icon ? <MaterialCommunityIcons name={icon} size={26} color={valueColor} /> : <View style={[styles.accentBar, accent && styles.accentBarActive, warning && styles.accentBarWarning]} />}
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    alignItems: 'flex-start',
    gap: Spacing.xs,
    minWidth: 120,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: colors.canvas,
  },
  accentBarActive: {
    backgroundColor: colors.primary,
  },
  accentBarWarning: {
    backgroundColor: colors.error,
  },
  value: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXxxl,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'left',
  },
});
