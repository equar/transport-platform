import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography } from '@theme/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            fontSize: isCompact ? Typography.sizeXl : Typography.sizeXxl,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { fontSize: isCompact ? Typography.sizeSm : Typography.sizeMd },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, marginBottom: Spacing.xs },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
});
