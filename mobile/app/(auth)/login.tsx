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
} from 'react-native';
import { useRouter } from 'expo-router';
import { resolveDefaultRoute, useAuth } from '@auth/AuthContext';
import { AppInput, AppButton } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('samuelweld2018+d1@gmail.com');
  const [password, setPassword] = useState('DriverTest123!');
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
      const nextSession = await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace(resolveDefaultRoute(nextSession) as never);
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
        {/* Brand header */}
        <View style={styles.header}>
          <Image
            source={require('../../src/assets/bakaroo-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Bakaroo Transports"
          />
          <Text style={styles.tagline}>Sign in to your account</Text>
        </View>

        {/* Form card */}
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
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  brandLogo: { width: 260, height: 260 },
  tagline: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.lg,
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
