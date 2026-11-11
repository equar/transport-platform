import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@theme/tokens';
import { AppButton } from './ui';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
export function RequestError({ onRetry, message = 'Try again, or contact your transport provider if this information remains unavailable.' }: { onRetry: () => void; message?: string }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: colors.background }, card: { borderRadius: Radius.lg, backgroundColor: colors.surface, padding: Spacing.xxl, borderWidth: 1, borderColor: colors.border, gap: Spacing.lg }, title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxl, color: colors.textPrimary }, body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: colors.textSecondary } }), []));
  return <View style={styles.screen}><View accessibilityRole="alert" style={styles.card}>
    <MaterialCommunityIcons name="cloud-alert-outline" color={colors.primary} size={32} />
    <Text style={styles.title}>We couldn’t load this</Text><Text style={styles.body}>{message}</Text>
    <AppButton label="Try again" leftIcon="refresh" onPress={onRetry} />
  </View></View>;
}
