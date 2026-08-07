import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '@theme/tokens';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxxl,
  },
  text: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
});
