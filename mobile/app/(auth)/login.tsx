import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileDefaultRoute } from '@auth/access';
import { useAuth } from '@auth/AuthContext';
import { AuthFrame } from '@components/AuthFrame';
import { AppInput, AppButton } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  async function submit() {
    setSubmitted(true); setError('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !password || loading) return;
    setLoading(true);
    try { const session = await signIn({ email: email.trim().toLowerCase(), password }); router.replace(mobileDefaultRoute(session) as never); }
    catch (err) { setError(err instanceof Error ? err.message : 'We couldn’t sign you in. Check your details and try again.'); }
    finally { setLoading(false); }
  }
  return <AuthFrame title="Welcome back" description="Sign in to manage your trips and stay connected with your transport provider."
    footer={<AppButton label="Forgot your password?" variant="ghost" onPress={() => router.push('/(auth)/forgot-password')} />}>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={styles.fields}>
      <AppInput label="Email address" hideLabel leftIcon="account-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" editable={!loading} error={submitted && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : undefined} />
      <AppInput label="Password" hideLabel leftIcon="lock-outline" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoComplete="current-password" editable={!loading} error={submitted && !password ? 'Enter your password.' : undefined} />
    </View>
    <AppButton label="Sign in" onPress={() => void submit()} loading={loading} fullWidth size="lg" />
  </AuthFrame>;
}
const styles = StyleSheet.create({ fields: { gap: Spacing.lg }, error: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: Colors.error, lineHeight: 22 } });
