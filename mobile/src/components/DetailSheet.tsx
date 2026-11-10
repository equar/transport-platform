import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { AppButton } from './ui';
export function DetailSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
    <SafeAreaView style={styles.screen} edges={['top','bottom','left','right']}>
      <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { color: Colors.white }]}>{title}</Text><AppButton label="Close" leftIcon="close" variant="secondary" onPress={onClose} /></View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.secondaryDark, borderBottomWidth: 1, borderColor: Colors.border }, title: { flex: 1, fontFamily: Typography.fontHeading, color: Colors.textPrimary, fontSize: Typography.sizeXl }, content: { padding: Spacing.xl, gap: Spacing.lg } });
