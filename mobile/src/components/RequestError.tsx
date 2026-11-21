import React from 'react';
import { requestErrorMessage } from '@utils/requestError';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@theme/tokens';
import { AppButton } from './ui';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
export function RequestError({ onRetry, message, error, retryLabel = 'Try again' }: { onRetry: () => void; message?: string; error?: unknown; retryLabel?: string }) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: colors.background }, card: { borderRadius: Radius.lg, backgroundColor: colors.surface, padding: Spacing.xxl, borderWidth: 0, borderColor: colors.border, gap: Spacing.lg }, title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxl, color: colors.textPrimary }, body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: colors.textSecondary } }), []));
  return <View style={styles.screen}><View accessibilityRole="alert" style={styles.card}>
    <MaterialCommunityIcons name="cloud-alert-outline" color={colors.primary} size={32} />
    <Text style={styles.title}>We couldn’t load this</Text><Text style={styles.body}>{message ?? requestErrorMessage(error)}</Text>
    <AppButton label={retryLabel} leftIcon="refresh" onPress={onRetry} />
  </View></View>;
}
