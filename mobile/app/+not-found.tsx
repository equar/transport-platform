import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@theme/tokens';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>Page not found</Text>
      <Text style={styles.link} onPress={() => router.replace('/(auth)/login')}>
        Go home
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  code: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 48, color: Colors.primary },
  message: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeLg, color: Colors.textSecondary },
  link: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.primary, textDecorationLine: 'underline', marginTop: 8 },
});
