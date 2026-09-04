import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

interface RoleCommandDeckProps {
  label: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  toneColor: string;
  softColor: string;
  statusLabel?: string;
  statusColor?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function RoleCommandDeck({
  label,
  title,
  subtitle,
  icon,
  toneColor,
  softColor,
  statusLabel,
  statusColor = Colors.success,
  actionLabel,
  onActionPress,
}: RoleCommandDeckProps) {
  return (
    <View style={[styles.shell, { borderColor: toneColor }]}> 
      <View style={[styles.accentStrip, { backgroundColor: toneColor }]} />

      <View style={styles.topRow}>
        <View style={[styles.labelChip, { backgroundColor: softColor }]}>
          <MaterialCommunityIcons name={icon} size={14} color={toneColor} />
          <Text style={[styles.labelText, { color: toneColor }]}>{label}</Text>
        </View>

        {statusLabel ? (
          <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      {actionLabel && onActionPress ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onActionPress}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: toneColor }]}>{actionLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    ...Shadow.soft,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: Spacing.md,
    bottom: Spacing.md,
    width: 4,
    borderTopRightRadius: Radius.full,
    borderBottomRightRadius: Radius.full,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  labelText: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizeXs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusChip: {
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  statusText: {
    color: Colors.white,
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizeXs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actionRow: {
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  },
  actionButton: {
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceMuted,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizeSm,
  },
});