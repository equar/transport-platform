import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Radius, Spacing, Typography } from '@theme/tokens';

export function DashboardHeader({ name, role }: { name: string; role: 'driver' | 'rider' | 'guardian' }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    header: { borderRadius: Radius.lg, padding: Spacing.md, overflow: 'hidden', minHeight: 72, justifyContent: 'center' },
    copy: { zIndex: 1, gap: 4 },
    title: { fontFamily: Typography.fontBodyBold, fontSize: 21, letterSpacing: -.6, color: colors.textPrimary },
    subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: colors.textPrimary },
  }), []));
  return <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
    <View style={styles.copy}>
      <Text accessibilityRole="header" style={styles.title}>Hello, {name}</Text>
      <Text style={styles.subtitle}>{role === 'driver' ? 'Your routes and trips' : role === 'guardian' ? 'Your linked riders' : 'Your trips and updates'}</Text>
    </View>
  </View>;
}
