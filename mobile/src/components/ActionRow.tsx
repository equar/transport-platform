import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Density, Motion, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

type ActionRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
  density?: 'compact' | 'comfortable';
  disabled?: boolean;
};

export function ActionRow({ icon, title, description, onPress, tone = 'primary', density = 'comfortable', disabled = false }: ActionRowProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const color = tone === 'primary' ? Colors.primary : Colors.secondary;
  const effectiveDensity = isCompact ? 'compact' : density;
  const spacing = effectiveDensity === 'compact' ? Density.compact : Density.comfortable;
  const iconSize = isCompact ? 19 : 22;

  return <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.row,
      {
        padding: spacing.contentPadding,
        minHeight: spacing.rowMinHeight,
      },
      pressed && !disabled && styles.pressed,
      disabled && styles.disabled,
    ]}
    android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
    hitSlop={4}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={description}
    accessibilityState={{ disabled }}
  >
    <View style={[styles.icon, effectiveDensity === 'compact' && styles.iconCompact, { backgroundColor: tone === 'primary' ? Colors.primarySoft : Colors.secondarySoft }]}><MaterialCommunityIcons name={icon} size={iconSize} color={color} /></View>
    <View style={styles.copy}>
      <Text style={[styles.title, { fontSize: isCompact ? Typography.sizeSm : Typography.sizeMd }]}>{title}</Text>
      <Text style={[styles.description, { fontSize: isCompact ? Typography.sizeXs : Typography.sizeSm }]}>{description}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.soft },
  pressed: { opacity: .8, transform: [{ scale: Motion.pressScale.subtle }] },
  disabled: { opacity: 0.55 },
  icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconCompact: { width: 40, height: 40 },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeMd, color: Colors.textPrimary },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary },
});
