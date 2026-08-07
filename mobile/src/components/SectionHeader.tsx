import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography } from '@theme/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
});
