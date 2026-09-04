import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';

interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
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

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
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
}: AppInputProps) {
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
  }, [error, success]);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          dense && styles.inputContainerDense,
          focused && styles.focused,
          !!error && styles.errored,
          !!success && !error && styles.success,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            dense && styles.inputDense,
            multiline && { height: numberOfLines * 20, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          editable={editable}
          maxLength={maxLength}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {(helperText || (showCount && maxLength)) ? (
        <View style={styles.helperRow}>
          <Text style={[styles.helperBase, helperStyle]}>{helperText ?? ' '}</Text>
          {showCount && maxLength ? (
            <Text style={styles.counterText}>
              {value.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputContainerDense: {
    minHeight: 44,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  errored: {
    borderColor: Colors.error,
  },
  success: {
    borderColor: Colors.success,
  },
  disabled: {
    backgroundColor: Colors.canvas,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  inputDense: {
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    padding: Spacing.xs,
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
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXs,
  },
  hintText: {
    color: Colors.textSecondary,
  },
  successText: {
    color: Colors.success,
  },
  errorText: {
    color: Colors.error,
  },
  counterText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
  },
});
