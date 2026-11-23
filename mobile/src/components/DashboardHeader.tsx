import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Radius, Spacing, Typography } from '@theme/tokens';

export function DashboardHeader({ name }: { name: string }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    header: { borderRadius: Radius.lg, padding: Spacing.md, overflow: 'hidden', minHeight: 72, justifyContent: 'center' },
    copy: { zIndex: 1, gap: 4 },
    title: { fontFamily: Typography.fontBodyBold, fontSize: 21, letterSpacing: -.6, color: colors.textPrimary },
  }), []));
  return <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
    <View style={styles.copy}>
      <Text accessibilityRole="header" style={styles.title}>{name ? `Hello, ${name}` : 'Welcome'}</Text>
    </View>
  </View>;
}
