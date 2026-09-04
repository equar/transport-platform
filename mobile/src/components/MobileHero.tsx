import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function MobileHero({ eyebrow, title, description, icon = 'navigation-variant' }: { eyebrow: string; title: string; description: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  return (
    <View style={styles.hero}>
      <View style={styles.icon}><MaterialCommunityIcons name={icon} size={24} color={Colors.white} /></View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: Colors.surfaceStrong, borderRadius: Radius.lg, padding: Spacing.xl, minHeight: 184, justifyContent: 'flex-end', ...Shadow.card },
  icon: { position: 'absolute', right: Spacing.xl, top: Spacing.xl, width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' },
  eyebrow: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeXs, color: '#bcd8ff', textTransform: 'uppercase', marginBottom: Spacing.sm },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxxl, color: Colors.white, lineHeight: 34 },
  description: { marginTop: Spacing.sm, maxWidth: '86%', fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: 'rgba(255,255,255,.68)', lineHeight: 20 },
});
