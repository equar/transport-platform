import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
export function Pagination({ page, pages, onChange, label }: { page: number; pages: number; onChange: (page: number) => void; label: string }) {
  if (pages <= 1) return null;
  return <View style={styles.section}>
    <Text style={styles.caption}>{label} · Page {page+1} of {pages}</Text><View style={styles.row}>
      <AppButton label="Previous" leftIcon="chevron-left" variant="outlined" style={styles.button} disabled={page===0} onPress={() => onChange(page-1)} />
      <AppButton label="Next" rightIcon="chevron-right" variant="outlined" style={styles.button} disabled={page+1>=pages} onPress={() => onChange(page+1)} />
    </View>
  </View>;
}
const styles = StyleSheet.create({ section: { gap: Spacing.sm }, row: { flexDirection: 'row', gap: Spacing.md }, button: { flex: 1 }, caption: { fontFamily: Typography.fontBody, color: Colors.textSecondary, fontSize: Typography.sizeSm } });
