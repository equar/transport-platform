import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { Spacing, Typography } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';
import { useBrandingColors } from '@theme/BrandingContext';
import { AppButton } from './ui';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xxxl },
    icon: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 28 }, title: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeLg, color: colors.textPrimary, textAlign: 'center' },
    description: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeMd, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  }), []));
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="inbox-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="outlined" size="sm" />
      ) : null}
    </View>
  );
}
