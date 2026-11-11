import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function MobileHero({ eyebrow, title, description, icon = 'navigation-variant' }: { eyebrow: string; title: string; description: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  const styles = useThemedStyles(createStyles);
  const colors = useBrandingColors();


  return (
    <View style={styles.hero}>
      <View style={[styles.glow, { backgroundColor: colors.primary }]} />
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    minHeight: 148,
    justifyContent: 'flex-end',
    ...Shadow.card,
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -40,
    top: -35,
    borderRadius: Radius.full,
    opacity: 0.12,
  },
  icon: {
    position: 'absolute',
    right: Spacing.xl,
    top: Spacing.xl,
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.sizeXxl,
    paddingRight: 60,
    color: colors.textPrimary,
    lineHeight: 34,
  },
  description: {
    marginTop: Spacing.sm,
    maxWidth: '86%',
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
