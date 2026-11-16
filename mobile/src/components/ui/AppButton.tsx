import { useBrandingColors } from '@theme/BrandingContext';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { Motion, Radius, Shadow, Spacing, Typography } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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

function getVariantStyles(variant: Variant, styles: ReturnType<typeof createStyles>, colors: ReturnType<typeof useBrandingColors>) {
  switch (variant) {
    case 'primary':
      return { container: styles.primary, label: styles.labelFilled, iconColor: colors.surface };
    case 'secondary':
      return { container: styles.secondary, label: styles.labelFilled, iconColor: colors.surface };
    case 'outlined':
      return { container: styles.outlined, label: styles.labelDark, iconColor: colors.primary };
    case 'ghost':
      return { container: styles.ghost, label: styles.labelDark, iconColor: colors.primary };
    case 'destructive':
      return { container: styles.destructive, label: styles.labelFilled, iconColor: colors.surface };
    default:
      return { container: styles.primary, label: styles.labelFilled, iconColor: colors.surface };
  }
}

export function AppButton({
  label,
  accessibilityLabel,
  accessibilityHint,
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
  const colors = useBrandingColors();
  const styles = useThemedStyles(useCallback(createStyles, []));
  const dim = sizeMap[size];
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant, styles, colors);
  const tint = variant === 'primary' ? { backgroundColor: colors.accent }
    : variant === 'secondary' ? { backgroundColor: colors.secondary }
    : variant === 'outlined' ? { borderColor: colors.primary, backgroundColor: colors.surface }
    : variant === 'ghost' ? { backgroundColor: 'transparent' }
    : {};
  const brandedText = variant === 'outlined' || variant === 'ghost';
  const iconColor = brandedText ? colors.primary : variantStyles.iconColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { minHeight: Math.max(48, dim.height), paddingVertical: 8, paddingHorizontal: dim.px, borderRadius: Radius.md },
        variantStyles.container,
        tint,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.09)' }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <MaterialCommunityIcons name={leftIcon} size={dim.icon} color={iconColor} /> : null}
          <Text style={[styles.labelBase, { fontSize: variant === 'primary' ? Math.max(18, dim.fontSize) : dim.fontSize }, variantStyles.label, brandedText && { color: colors.primary }]}>{label}</Text>
          {rightIcon ? <MaterialCommunityIcons name={rightIcon} size={dim.icon} color={iconColor} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useBrandingColors>) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    ...StyleSheet.flatten(Shadow.soft),
  },
  secondary: {
    backgroundColor: colors.secondary,
    ...StyleSheet.flatten(Shadow.soft),
  },
  destructive: {
    backgroundColor: colors.error,
    ...StyleSheet.flatten(Shadow.soft),
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: colors.overlay,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: Motion.pressScale.subtle }],
    opacity: 0.98,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  labelBase: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: Typography.fontBodyMedium,
    fontWeight: '600',
    letterSpacing: 0.12,
  },
  labelFilled: {
    color: colors.surface,
  },
  labelDark: {
    color: colors.primary,
  },
});
