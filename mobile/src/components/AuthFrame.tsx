import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { BrandWordmark } from './BrandWordmark';

export function AuthFrame({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View style={styles.content}>
        <BrandWordmark />
        <View style={styles.form}>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
          {children}
          {footer}
          <Text style={styles.note}>Your transport, connected.</Text>
        </View>
      </View>
    </ScrollView>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.waveArea}>
      <View style={styles.orangeWave} /><View style={styles.navyWave} />
    </View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: 72 },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: Spacing.lg },
  form: { gap: Spacing.lg },
  heading: { gap: Spacing.xs },
  title: { fontFamily: Typography.fontHeading, fontSize: 26, letterSpacing: -0.8, color: Colors.textPrimary },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: Colors.textPrimary },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary, textAlign: 'center' },
  waveArea: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, overflow: 'hidden' },
  orangeWave: { position: 'absolute', height: 100, width: '150%', bottom: -65, left: '-15%', borderTopLeftRadius: 180, borderTopRightRadius: 100, backgroundColor: Colors.accent, transform: [{ rotate: '-8deg' }] },
  navyWave: { position: 'absolute', height: 90, width: '150%', bottom: -76, left: '-15%', borderTopLeftRadius: 180, backgroundColor: Colors.secondaryDark, transform: [{ rotate: '-8deg' }] },
});
