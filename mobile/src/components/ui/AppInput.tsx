import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ViewStyle, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  accessibilityLabel?: string;
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
  style,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  accessibilityLabel,
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          !!error && styles.errored,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 20, textAlignVertical: 'top' }]}
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
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityState={{ disabled: !editable }}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  focused: {
    borderColor: Colors.primary,
  },
  errored: {
    borderColor: Colors.error,
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeXs,
    color: Colors.error,
  },
});
