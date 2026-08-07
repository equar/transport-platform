import React from 'react';
import { StyleSheet, Pressable, ActivityIndicator, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

type Variant = 'primary' | 'secondary' | 'outlined' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Minimum height satisfies the 44x44dp/pt tappable-area guideline on both platforms.
const sizeMap = {
  sm: { height: 44, px: Spacing.md, fontSize: Typography.sizeSm },
  md: { height: 48, px: Spacing.lg, fontSize: Typography.sizeMd },
  lg: { height: 52, px: Spacing.xl, fontSize: Typography.sizeLg },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const dim = sizeMap[size];
  const isDisabled = disabled || loading;

  const textStyle = [
    styles.label,
    { fontSize: dim.fontSize },
    variant === 'outlined' && styles.labelOutlined,
    variant === 'ghost' && styles.labelGhost,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { height: dim.height, paddingHorizontal: dim.px, borderRadius: Radius.md },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outlined' && styles.outlined,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={isDisabled ? undefined : { color: 'rgba(0,0,0,0.12)', foreground: true }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outlined' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadow.card,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    color: Colors.white,
    fontFamily: 'SourceSans3_700Bold',
    fontWeight: '700',
  },
  labelOutlined: {
    color: Colors.primary,
  },
  labelGhost: {
    color: Colors.primary,
  },
});
