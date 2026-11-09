import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function AuthFrame({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brand} accessible accessibilityLabel="Bakaroo Transport logo">
              <Image source={require('../assets/bakaroo-logo.png')} style={styles.brandLogo} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            {children}
          </View>

          {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
          <Text style={styles.note}>Your transport, connected.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: Spacing.xl },
  topBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandLogo: {
    width: 520,
    height: 180,
    maxWidth: '100%',
  },
  statusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  statusText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.sizeXs,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.xl,
    ...Shadow.card,
  },
  heading: { gap: Spacing.sm },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxxl, letterSpacing: -0.8, color: Colors.textPrimary },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: Colors.textSecondary },
  footerWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.soft,
  },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary, textAlign: 'center' },
});
