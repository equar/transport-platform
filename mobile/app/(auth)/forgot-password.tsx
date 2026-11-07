import { useState } from 'react';
import { useRouter } from 'expo-router';
import { authApi } from '@api/authApi';
import { AuthFrame } from '@components/AuthFrame';
import { AppInput, AppButton } from '@components/ui';
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setPending(true); setError('');
    try { await authApi.requestPasswordReset(email.trim()); setSubmitted(true); }
    catch { setError('We couldn’t send instructions. Check your connection and try again.'); }
    finally { setPending(false); }
  }
  return <AuthFrame title={submitted ? 'Check your email' : 'Reset your password'}
    description={submitted ? `If an account exists for ${email.trim()}, you’ll receive a reset link shortly. Check your inbox and junk folder.` : 'Enter the email address you use for Transport. We’ll send you a secure reset link.'}
    footer={<AppButton label="Back to sign in" leftIcon="arrow-left" variant="ghost" onPress={() => router.replace('/(auth)/login')} />}>
    {submitted ? <AppButton label="Return to sign in" onPress={() => router.replace('/(auth)/login')} /> : <>
      <AppInput label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" error={error} editable={!pending} />
      <AppButton label="Send reset link" loading={pending} onPress={() => void submit()} fullWidth />
    </>}
  </AuthFrame>;
}
