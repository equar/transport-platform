import { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppInput } from '@components/ui';
import { authApi } from '@api/authApi';
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit() {
    if (!token || password !== confirm || password.length < 12) {
      Alert.alert('Check password', 'Use at least 12 characters and matching passwords. If the link is missing, request a new one.'); return;
    }
    setPending(true);
    try { await authApi.resetPassword(token, password); Alert.alert('Password updated', 'Sign in with your new password.'); router.replace('/(auth)/login'); }
    catch { Alert.alert('Unable to reset password', 'The link may be expired or already used. Request another link or try again.'); }
    finally { setPending(false); }
  }
  return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}><Text>Choose a new password</Text>
    <AppInput label="New password" value={password} onChangeText={setPassword} secureTextEntry />
    <AppInput label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
    <AppButton label="Reset password" loading={pending} onPress={submit} />
    <AppButton label="Request a new link" variant="outlined" onPress={() => router.replace('/(auth)/forgot-password')} />
  </View>;
}
