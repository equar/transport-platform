import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
export function AuthFrame({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={styles.content}>
        <View style={styles.brand} accessible accessibilityLabel="Bakaroo Transports">
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <View><Text style={styles.brandName}>bakaroo<Text style={styles.dot}>.</Text></Text><Text style={styles.brandCaption}>TRANSPORTS</Text></View>
        </View>
        <View style={styles.card}>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
          {children}
        </View>
        {footer}
        <Text style={styles.note}>Your transport, connected.</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, paddingVertical: Spacing.xxxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: Spacing.xl },
  brand: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  logo: { width: 48, height: 48, borderRadius: Radius.lg },
  brandName: { fontFamily: Typography.fontHeading, fontSize: 30, letterSpacing: -1, color: Colors.textPrimary, lineHeight: 36 },
  dot: { color: Colors.accent },
  brandCaption: { fontFamily: Typography.fontBodyMedium, fontSize: 10, letterSpacing: 2.4, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.xl },
  heading: { gap: Spacing.sm },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxxl, letterSpacing: -0.8, color: Colors.textPrimary },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: Colors.textSecondary },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary, textAlign: 'center' },
});
