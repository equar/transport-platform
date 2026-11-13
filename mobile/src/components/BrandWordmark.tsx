// Metro requires a static require expression for bundled images.
/* eslint @typescript-eslint/no-require-imports: [error, { allow: ['\\.png$'] }] */
import { Image, StyleSheet, Text, View } from 'react-native';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from '@theme/tokens';

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const colors = useBrandingColors();
  if (!compact) return <Image accessibilityLabel="Bakaroo Transport logo" source={require('../assets/bakaroo-logo.png')} resizeMode="contain" style={styles.logo} />;
  return <View accessible accessibilityLabel="Bakaroo Transport" style={styles.wordmark}>
    <MaterialCommunityIcons name="bus-side" size={34} color={colors.accent} />
    <View><Text style={styles.name}>Bakaroo</Text><Text style={styles.subtitle}>TRANSPORT</Text></View>
  </View>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({
  logo: { width: 160, height: 160, maxWidth: '100%', alignSelf: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: Typography.fontBodyBold, fontStyle: 'italic', color: colors.white, fontSize: 25, lineHeight: 29 },
  subtitle: { fontFamily: Typography.fontBodyMedium, color: colors.white, fontSize: 9, letterSpacing: 3, textAlign: 'center' },
});
