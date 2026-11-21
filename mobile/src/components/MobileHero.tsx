import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function MobileHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  const styles = useThemedStyles(createStyles);


  return (
    <View style={styles.hero}>
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
    borderWidth: 0,
    borderColor: colors.divider,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    minHeight: 0,
    justifyContent: 'flex-end',
    ...Shadow.card,
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
    paddingRight: 0,
    color: colors.textPrimary,
    lineHeight: 34,
  },
  description: {
    marginTop: Spacing.sm,
    maxWidth: '100%',
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
