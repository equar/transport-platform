import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Spacing, Typography } from '@theme/tokens';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxxl }, text: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeMd, color: colors.textSecondary } }), []));
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
