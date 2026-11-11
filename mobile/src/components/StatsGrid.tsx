import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Radius, Shadow, Spacing, Typography } from '@theme/tokens';
export function StatsGrid({ items }: { items: { label: string; value: number | string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; warning?: boolean }[] }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    tile: { flexBasis: '45%', flexGrow: 1, minWidth: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs, ...Shadow.soft },
    icon: { backgroundColor: colors.primarySoft, padding: Spacing.sm, borderRadius: Radius.md, alignSelf: 'flex-start' },
    value: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxl, color: colors.textPrimary },
    label: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: colors.textSecondary },
  }), []));
  return <View style={styles.grid}>{items.map(item => <View key={item.label} style={styles.tile}>
    <View style={[styles.icon, item.warning && { backgroundColor: colors.warningSoft }]}><MaterialCommunityIcons name={item.icon} size={18} color={item.warning ? colors.warning : colors.primary} /></View>
    <Text style={styles.value}>{item.value}</Text><Text style={styles.label}>{item.label}</Text>
  </View>)}</View>;
}
