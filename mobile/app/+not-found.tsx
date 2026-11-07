import { AppButton } from '@components/ui';
import { useAuth } from '@auth/AuthContext';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@theme/tokens';

export default function NotFound() {
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

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, padding: 24, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  code: { fontFamily: 'Manrope_700Bold', fontSize: 48, color: Colors.primary },
  message: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeLg, color: Colors.textSecondary },
  link: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeMd, color: Colors.primary, textDecorationLine: 'underline', marginTop: 8 },
});
