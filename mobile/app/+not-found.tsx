import { AppButton } from '@components/ui';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { useAuth } from '@auth/AuthContext';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@theme/tokens';

export default function NotFound() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { getDefaultRoute } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>Page not found</Text>
      <AppButton label="Go home" onPress={() => router.replace(getDefaultRoute() as never)} />
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, padding: 24, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  code: { fontFamily: 'Manrope_700Bold', fontSize: 48, color: colors.primary },
  message: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeLg, color: colors.textSecondary },
  link: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeMd, color: colors.primary, textDecorationLine: 'underline', marginTop: 8 },
});
