import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { Colors, Motion, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

type Variant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  leftIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  rightIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const sizeMap = {
  xs: { height: 30, px: Spacing.sm, fontSize: Typography.sizeSm, icon: 14 },
  sm: { height: 34, px: Spacing.md, fontSize: Typography.sizeSm, icon: 16 },
  md: { height: 40, px: Spacing.lg, fontSize: Typography.sizeMd, icon: 18 },
  lg: { height: 48, px: Spacing.xl, fontSize: Typography.sizeLg, icon: 20 },
};

function getVariantStyles(variant: Variant) {
  switch (variant) {
    case 'primary':
      return {
        container: styles.primary,
        label: styles.labelLight,
        iconColor: Colors.white,
      };
    case 'secondary':
      return {
        container: styles.secondary,
        label: styles.labelLight,
        iconColor: Colors.white,
      };
    case 'outlined':
      return {
        container: styles.outlined,
        label: styles.labelDark,
        iconColor: Colors.primary,
      };
    case 'ghost':
      return {
        container: styles.ghost,
        label: styles.labelDark,
        iconColor: Colors.primary,
      };
    case 'destructive':
      return {
        container: styles.destructive,
        label: styles.labelLight,
        iconColor: Colors.white,
      };
    default:
      return {
        container: styles.primary,
        label: styles.labelLight,
        iconColor: Colors.white,
      };
  }
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  leftIcon,
  rightIcon,
}: AppButtonProps) {
  const dim = sizeMap[size];
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { height: dim.height, paddingHorizontal: dim.px, borderRadius: Radius.input },
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.09)' }}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.iconColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <MaterialCommunityIcons name={leftIcon} size={dim.icon} color={variantStyles.iconColor} /> : null}
          <Text style={[styles.labelBase, { fontSize: dim.fontSize }, variantStyles.label]}>{label}</Text>
          {rightIcon ? <MaterialCommunityIcons name={rightIcon} size={dim.icon} color={variantStyles.iconColor} /> : null}
        </View>
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...StyleSheet.flatten(Shadow.soft),
  },
  secondary: {
    backgroundColor: Colors.secondary,
    ...StyleSheet.flatten(Shadow.soft),
  },
  destructive: {
    backgroundColor: Colors.error,
    ...StyleSheet.flatten(Shadow.soft),
  },
  outlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  ghost: {
    backgroundColor: Colors.overlay,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: Motion.pressScale.subtle }],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  labelBase: {
    fontFamily: Typography.fontBodyBold,
    fontWeight: '700',
  },
  labelLight: {
    color: Colors.white,
  },
  labelDark: {
    color: Colors.primary,
  },
});
