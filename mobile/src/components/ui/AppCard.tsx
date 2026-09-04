import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Colors, Density, Radius, Shadow, Spacing } from '@theme/tokens';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  variant?: 'default' | 'subtle';
}

export function AppCard({ children, style, noBorder, density = 'comfortable', variant = 'default' }: AppCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const paddingByDensity = {
    compact: Density.compact.contentPadding,
    comfortable: Density.comfortable.contentPadding,
    spacious: Density.spacious.contentPadding,
  }[density];

  const adaptivePadding = isCompact
    ? Math.max(paddingByDensity - Spacing.xs, Density.compact.contentPadding)
    : paddingByDensity;

  return (
    <View
      style={[
        styles.card,
        { padding: adaptivePadding, borderRadius: Radius.lg },
        variant === 'subtle' && styles.subtle,
        noBorder && styles.noBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  subtle: {
    backgroundColor: Colors.surfaceMuted,
    ...Shadow.soft,
  },
  noBorder: {
    borderWidth: 0,
  },
});
