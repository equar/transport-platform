import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
export function StatsGrid({ items }: { items: { label: string; value: number | string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; warning?: boolean }[] }) {
  return <View style={styles.grid}>{items.map(item => <View key={item.label} style={styles.tile}>
    <View style={[styles.icon, item.warning && { backgroundColor: Colors.warningSoft }]}><MaterialCommunityIcons name={item.icon} size={20} color={item.warning ? Colors.warning : Colors.primary} /></View>
    <Text style={styles.value}>{item.value}</Text><Text style={styles.label}>{item.label}</Text>
  </View>)}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: { flexBasis: '45%', flexGrow: 1, minWidth: 120, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  icon: { backgroundColor: Colors.primarySoft, padding: Spacing.sm, borderRadius: Radius.md, alignSelf: 'flex-start' },
  value: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxxl, color: Colors.textPrimary },
  label: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary },
});
