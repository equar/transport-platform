import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function ActionRow({ icon, title, description, onPress, tone = 'primary' }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; description: string; onPress: () => void; tone?: 'primary' | 'secondary' }) {
  const color = tone === 'primary' ? Colors.primary : Colors.secondary;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <View style={[styles.icon, { backgroundColor: tone === 'primary' ? Colors.primarySoft : Colors.secondarySoft }]}><MaterialCommunityIcons name={icon} size={22} color={color} /></View>
    <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
    <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.card },
  pressed: { opacity: .75, transform: [{ scale: .985 }] },
  icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeMd, color: Colors.textPrimary },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: Colors.textSecondary },
});
