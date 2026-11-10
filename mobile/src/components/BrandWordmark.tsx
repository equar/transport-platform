import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography } from '@theme/tokens';

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  if (!compact) return <Image accessibilityLabel="Bakaroo Transport logo" source={require('../assets/bakaroo-logo.png')} resizeMode="contain" style={styles.logo} />;
  return <View accessible accessibilityLabel="Bakaroo Transport" style={styles.wordmark}>
    <MaterialCommunityIcons name="bus-side" size={34} color={Colors.accent} />
    <View><Text style={styles.name}>Bakaroo</Text><Text style={styles.subtitle}>TRANSPORT</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  logo: { width: 160, height: 160, maxWidth: '100%', alignSelf: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: Typography.fontBodyBold, fontStyle: 'italic', color: Colors.white, fontSize: 25, lineHeight: 29 },
  subtitle: { fontFamily: Typography.fontBodyMedium, color: Colors.white, fontSize: 9, letterSpacing: 3, textAlign: 'center' },
});
