import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export function MobileHero({ eyebrow, title, description, icon = 'navigation-variant' }: { eyebrow: string; title: string; description: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  return (
    <View style={styles.hero}>
      <View style={styles.orb} />
      <View style={styles.icon}><MaterialCommunityIcons name={icon} size={24} color={Colors.white} /></View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: '#0a3440', borderRadius: Radius.lg, padding: Spacing.xl, minHeight: 205, justifyContent: 'flex-end', ...Shadow.card },
  orb: { position: 'absolute', width: 190, height: 190, borderRadius: 999, right: -55, top: -80, backgroundColor: '#176779', opacity: .8 },
  icon: { position: 'absolute', right: Spacing.xl, top: Spacing.xl, width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' },
  eyebrow: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeXs, color: '#f0a269', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: Spacing.sm },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxxl, color: Colors.white, lineHeight: 34 },
  description: { marginTop: Spacing.sm, maxWidth: '86%', fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: 'rgba(255,255,255,.68)', lineHeight: 20 },
});
