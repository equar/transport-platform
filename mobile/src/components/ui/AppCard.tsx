import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@theme/tokens';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
}

export function AppCard({ children, style, noBorder }: AppCardProps) {
  return (
    <View style={[styles.card, noBorder && styles.noBorder, style]}>
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
    padding: Spacing.lg,
    ...Shadow.card,
  },
  noBorder: {
    borderWidth: 0,
  },
});
