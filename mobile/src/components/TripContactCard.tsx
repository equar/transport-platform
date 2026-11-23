import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard } from './ui';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Spacing, Typography } from '@theme/tokens';

export function TripContactCard({ title, name, phone, callLabel, emptyLabel = 'Not provided' }: {
  title: string; name?: string | null; phone?: string | null; callLabel: string; emptyLabel?: string;
}) {
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    card: { gap: Spacing.sm },
    header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    title: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeLg, color: colors.textPrimary },
    name: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizeMd, color: colors.textPrimary, lineHeight: 23 },
    phone: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textSecondary, lineHeight: 23 },
  }), []));
  const mainNumber = phone?.trim().split(/\s*(?:ext\.?|extension|x|#)\s*/i)[0] ?? '';
  const digits = mainNumber.replace(/\D/g, '');
  const dialNumber = (mainNumber.startsWith('+') ? '+' : '') + digits;
  const canCall = /^\+?[\d\s().-]+$/.test(mainNumber) && digits.length >= 3 && digits.length <= 15;
  const call = () => {
    void Linking.openURL(`tel:${dialNumber}`).catch(() => Alert.alert('Couldn’t open the phone', 'Dial the contact number shown on this screen.'));
  };
  return <AppCard style={styles.card}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {canCall ? <AppButton label={callLabel} accessibilityLabel={`${callLabel}${name ? ` ${name}` : ''}`} variant="ghost" size="sm" fullWidth={false} leftIcon="phone-outline" onPress={call} /> : null}
    </View>
    <Text style={styles.name}>{name?.trim() || emptyLabel}</Text>
    {name?.trim() || phone?.trim() ? <Text selectable style={styles.phone}>{phone?.trim() || 'Phone number not provided'}</Text> : null}
  </AppCard>;
}
