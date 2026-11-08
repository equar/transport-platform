import { useBrandingColors } from '@theme/BrandingContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';
import { TenantHeader } from './TenantHeader';

export function DashboardHeader({ name, role, tenantId }: { name: string; role: 'driver' | 'rider' | 'guardian'; tenantId?: string | null }) {
  const colors = useBrandingColors();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '22' }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <View style={styles.pillRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.eyebrow}>
              {role === 'driver' ? 'Driver workspace' : role === 'guardian' ? 'Family workspace' : 'Your transport'}
            </Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>Hello, {name}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open alerts"
          onPress={() => router.push(`/(${role})/notifications` as never)}
          style={styles.button}
        >
          <MaterialCommunityIcons name="bell-outline" color={colors.primary} size={23} />
          <View style={[styles.badge, { backgroundColor: colors.primary }]} />
        </Pressable>
      </View>

      <TenantHeader tenantId={tenantId} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  eyebrow: {
    fontFamily: Typography.fontBodyMedium,
    color: Colors.textSecondary,
    fontSize: Typography.sizeSm,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
    fontSize: Typography.sizeXxxl,
    letterSpacing: -0.7,
  },
  button: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
