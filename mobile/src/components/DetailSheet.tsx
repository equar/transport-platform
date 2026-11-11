import type { ReactNode } from 'react';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Typography } from '@theme/tokens';
import { AppButton } from './ui';
export function DetailSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const colors = useBrandingColors();
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
    <SafeAreaView style={styles.screen} edges={['top','bottom','left','right']}>
      <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { color: colors.white }]}>{title}</Text><AppButton label="Close" leftIcon="close" variant="secondary" onPress={onClose} /></View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  </Modal>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: colors.secondaryDark, borderBottomWidth: 1, borderColor: colors.border }, title: { flex: 1, fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: Typography.sizeXl }, content: { padding: Spacing.xl, gap: Spacing.lg } });
