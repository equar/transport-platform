import React, { useCallback } from 'react';
import { View, ViewStyle, useWindowDimensions } from 'react-native';
import { Density, Radius, Shadow, Spacing } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  variant?: 'default' | 'subtle';
}

export function AppCard({ children, style, noBorder, density = 'comfortable', variant = 'default' }: AppCardProps) {
  const styles = useThemedStyles(useCallback(colors => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadow.card,
    },
    subtle: {
      backgroundColor: colors.surfaceMuted,
      ...Shadow.soft,
    },
    noBorder: {
      borderWidth: 0,
    },
  }), []));
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
