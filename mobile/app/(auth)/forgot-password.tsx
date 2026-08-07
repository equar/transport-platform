import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppInput, AppButton } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address to reset your password.');
      return;
    }
    // Backend reset endpoint not yet wired — show confirmation UI
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.body}>
          If an account exists for {email}, you'll receive a reset link shortly.
        </Text>
        <AppButton label="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset password</Text>
      <Text style={styles.body}>Enter your email and we'll send you a reset link.</Text>
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AppButton label="Send reset link" onPress={handleSubmit} fullWidth />
      <Text style={styles.link} onPress={() => router.back()}>
        Back to sign in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xxl,
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
  link: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: Spacing.sm,
  },
});
