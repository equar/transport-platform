import { useBrandingColors } from '@theme/BrandingContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle, type TextInputProps } from 'react-native';
import { Radius, Spacing, Typography } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';

interface AppInputProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  label?: string;
  hideLabel?: boolean;
  leftIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  success?: string;
  hintText?: string;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  dense?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const AppInput = React.forwardRef<TextInput, AppInputProps>(function AppInput({
  label,
  hideLabel = false,
  leftIcon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  autoComplete,
  keyboardType = 'default',
  error,
  success,
  hintText,
  style,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  dense = false,
  maxLength,
  showCount = false,
  autoCorrect,
  onFocus,
  onBlur,
  ...inputProps
}: AppInputProps, ref) {
  const colors = useBrandingColors();
  const styles = useThemedStyles(useCallback(createStyles, []));
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const helperText = error || success || hintText;
  const helperStyle = useMemo(() => {
    if (error) {
      return styles.errorText;
    }
    if (success) {
      return styles.successText;
    }
    return styles.hintText;
  }, [error, success, styles]);

  return (
    <View style={[styles.wrapper, style]}>
      {label && !hideLabel ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          dense && styles.inputContainerDense,
          focused && { borderColor: colors.primary },
          !!error && styles.errored,
          !!success && !error && styles.success,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon ? <MaterialCommunityIcons name={leftIcon} size={22} color={colors.primaryDark} style={{ marginRight: Spacing.sm }} /> : null}
        <TextInput
          {...inputProps}
          ref={ref}
          style={[
            styles.input,
            dense && styles.inputDense,
            multiline && { minHeight: Math.max(96, numberOfLines * 24), textAlignVertical: 'top' },
          ]}
          accessibilityLabel={inputProps.accessibilityLabel ?? label ?? placeholder}
          accessibilityState={{ disabled: !editable }}
          selectionColor={colors.primary}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect ?? (!secureTextEntry && keyboardType !== 'email-address')}
          accessibilityHint={helperText}
          keyboardType={keyboardType}
          onFocus={event => { setFocused(true); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          editable={editable}
          maxLength={maxLength}
        />
        {secureTextEntry ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {(helperText || (showCount && maxLength)) ? (
        <View style={styles.helperRow}>
          <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={[styles.helperBase, helperStyle]}>{helperText ?? ' '}</Text>
          {showCount && maxLength ? (
            <Text style={styles.counterText}>
              {value.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const createStyles = (colors: ReturnType<typeof useBrandingColors>) => StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: Radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputContainerDense: {
    minHeight: 44,
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  errored: {
    borderColor: colors.error,
  },
  success: {
    borderColor: colors.success,
  },
  disabled: {
    backgroundColor: colors.canvas,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLg,
    color: colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  inputDense: {
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    padding: Spacing.sm,
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: Typography.sizeMd,
  },
  helperRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  helperBase: {
    flexShrink: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXs,
  },
  hintText: {
    color: colors.textSecondary,
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.error,
  },
  counterText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
  },
});
