import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Radius, Spacing, Typography } from '@theme/tokens';

export function DashboardHeader({ name, role }: { name: string; role: 'driver' | 'rider' | 'guardian' }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    header: { borderRadius: Radius.lg, padding: Spacing.md, overflow: 'hidden', minHeight: 96, justifyContent: 'center' },
    copy: { zIndex: 1, gap: 4 },
    title: { fontFamily: Typography.fontBodyBold, fontSize: 21, letterSpacing: -.6, color: colors.textPrimary },
    subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: colors.textPrimary },
    skyline: { position: 'absolute', right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    building: { width: 15, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  }), []));
  return <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
    <View style={styles.copy}>
      <Text accessibilityRole="header" style={styles.title}>Hello, {name}</Text>
      <Text style={styles.subtitle}>{role === 'driver' ? 'Driver workspace' : role === 'guardian' ? 'Family workspace' : 'Your transport'}</Text>
    </View>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.skyline}>
      {[28, 48, 38, 66, 46, 80, 58].map((height, i) => <View key={i} style={[styles.building, { height, backgroundColor: colors.primary, opacity: .06 + i * .012 }]} />)}
    </View>
  </View>;
}
