import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
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
}

const sizeMap = {
  sm: { height: 32, px: Spacing.md, fontSize: Typography.sizeSm },
  md: { height: 40, px: Spacing.lg, fontSize: Typography.sizeMd },
  lg: { height: 48, px: Spacing.xl, fontSize: Typography.sizeLg },
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
}: AppButtonProps) {
  const dim = sizeMap[size];
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    { height: dim.height, paddingHorizontal: dim.px, borderRadius: Radius.md },
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outlined' && styles.outlined,
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    { fontSize: dim.fontSize },
    variant === 'outlined' && styles.labelOutlined,
    variant === 'ghost' && styles.labelGhost,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outlined' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
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
