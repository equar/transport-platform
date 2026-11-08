import { useBrandingColors } from '@theme/BrandingContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { TenantHeader } from './TenantHeader';
export function DashboardHeader({ name, role, tenantId }: { name: string; role: 'driver' | 'rider' | 'guardian'; tenantId?: string | null }) {
  const colors = useBrandingColors();
  const router = useRouter();
  return <View style={styles.header}>
    <View style={styles.row}>
      <View style={styles.copy}><Text style={styles.eyebrow}>{role === 'driver' ? 'Driver workspace' : role === 'guardian' ? 'Family workspace' : 'Your transport'}</Text>
      <Text accessibilityRole="header" style={styles.title}>Hello, {name}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open alerts" onPress={() => router.push(`/(${role})/notifications` as never)} style={styles.button}>
        <MaterialCommunityIcons name="bell-outline" color={colors.primary} size={23} />
      </Pressable>
    </View>
    <TenantHeader tenantId={tenantId} />
  </View>;
}
const styles = StyleSheet.create({
  header: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  copy: { flex: 1, minWidth: 0, gap: Spacing.sm },
  eyebrow: { fontFamily: Typography.fontBodyMedium, color: Colors.textSecondary, fontSize: Typography.sizeSm },
  title: { fontFamily: Typography.fontHeading, color: Colors.textPrimary, fontSize: Typography.sizeXxxl, letterSpacing: -0.7 },
  button: { width: 48, height: 48, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
});
