// Metro requires a static require expression for bundled images.
/* eslint @typescript-eslint/no-require-imports: [error, { allow: ['\\.png$'] }] */
import { Image, StyleSheet, View } from 'react-native';

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return <View style={[styles.backing, compact && styles.compact]}>
    <Image accessibilityLabel="Bakaroo Transport logo" accessibilityRole="image"
      source={require('../assets/bakaroo-wordmark.png')} resizeMode="contain" style={[styles.logo, compact && styles.compactLogo]} />
  </View>;
}

const styles = StyleSheet.create({
  // The official logo includes dark lettering; white also keeps it legible in dark mode.
  backing: { width: 240, maxWidth: '100%', height: 96, flexShrink: 0, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  compact: { width: 196, height: 76, padding: 8, borderRadius: 8 },
  // Explicit bounds prevent the high-resolution asset from determining native layout size.
  logo: { width: '100%', height: 72 },
  compactLogo: { height: 60 },
});
