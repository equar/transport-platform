import { mobileDefaultRoute } from "@auth/access";
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@auth/AuthContext';
import { AppInput, AppButton } from '@components/ui';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    try {
      const session = await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace(mobileDefaultRoute(session) as never);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCrop}>
              <Image
                source={require('../../src/assets/bakaroo-logo.png')}
                style={styles.logoMark}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            error={errors.password}
          />
          <AppButton
            label="Sign In"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>

        <Text
          style={styles.forgotLink}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          Forgot your password?
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logoWrap: {
    width: 296,
    height: 296,
    borderRadius: Radius.none,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  logoCrop: {
    width: 240,
    height: 240,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoMark: {
    width: 240,
    height: 308,
    transform: [{ translateY: -2 }],
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.card,
  },
  quickDriverSection: {
    gap: Spacing.xs,
  },
  quickDriverLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  quickDriverTrigger: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  quickDriverTriggerText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  quickDriverChevron: {
    fontFamily: Typography.fontBodyBold,
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  quickDriverList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  quickDriverOption: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickDriverOptionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  quickDriverHint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
  },
  forgotLink: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: Spacing.sm,
  },
});
