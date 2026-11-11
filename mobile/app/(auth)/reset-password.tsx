import { passwordValidationError } from '@utils/passwordPolicy';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthFrame } from '@components/AuthFrame';
import { AppButton, AppInput } from '@components/ui';
import { Typography } from '@theme/tokens';
import { authApi } from '@api/authApi';
export default function ResetPassword() {
  const styles = useThemedStyles(createStyles);
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit() {
    if (!token || password !== confirm) { setError('Use a valid reset link and matching passwords.'); return; }
    const problem = passwordValidationError(password);
    if (problem) { setError(problem); return; }
    setPending(true); setError('');
    try { await authApi.resetPassword(token, password); setComplete(true); }
    catch (error) { setError(error instanceof Error ? error.message : 'This link may have expired or already been used. Request another link or try again.'); }
    finally { setPending(false); }
  }
  return <AuthFrame title={complete ? 'Password updated' : 'Choose a new password'} description={complete ? 'Your password has been changed. Sign in with your new password to continue.' : 'Use a unique password with at least 8 characters.'}
    footer={<AppButton label="Back to sign in" variant="ghost" onPress={() => router.replace('/(auth)/login')} />}>
    {complete ? <AppButton label="Sign in" onPress={() => router.replace('/(auth)/login')} /> : !token ? <>
      <Text style={styles.body}>The reset link is missing. Request a new link to continue.</Text><AppButton label="Request reset link" onPress={() => router.replace('/(auth)/forgot-password')} />
    </> : <>
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <AppInput label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" editable={!pending} />
      <AppInput label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" editable={!pending} />
      <AppButton label="Update password" loading={pending} onPress={() => void submit()} />
      <AppButton label="Request a new link" variant="outlined" onPress={() => router.replace('/(auth)/forgot-password')} />
    </>}
  </AuthFrame>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({ body: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeMd, lineHeight: 23 }, error: { fontFamily: Typography.fontBody, color: colors.error, fontSize: Typography.sizeMd, lineHeight: 23 } });
