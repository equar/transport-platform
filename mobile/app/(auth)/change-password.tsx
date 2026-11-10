import { passwordValidationError } from '@utils/passwordPolicy';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { AuthFrame } from '@components/AuthFrame';
import { Colors, Typography } from '@theme/tokens';
import { useAuth } from '@auth/AuthContext';
import { authApi } from '@api/authApi';
import { AppButton, AppInput } from '@components/ui';
export default function ChangePasswordScreen() {
  const { signOut } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!current || password !== confirmation) { setError('Enter your current password and matching new passwords.'); return; }
    const problem = passwordValidationError(password);
    if (problem) { setError(problem); return; }
    setSaving(true); setError('');
    try { await authApi.changePassword({ currentPassword: current, newPassword: password }); await signOut(); }
    catch { setError('Password could not be changed. Check your current password and try again.'); }
    finally { setSaving(false); }
  }
  return <AuthFrame title="Make it yours" description="Choose a new password before accessing your trips. You’ll sign in again after this change.">
    {!!error && <Text accessibilityRole="alert" style={{ color: Colors.error, fontFamily: Typography.fontBody, lineHeight: 23 }}>{error}</Text>}
    <AppInput label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" editable={!saving} />
    <AppInput label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" hintText="Use at least 8 characters." editable={!saving} />
    <AppInput label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" editable={!saving} />
    <AppButton label="Update password" onPress={() => void save()} loading={saving}/>
    <AppButton label="Sign out" variant="ghost" onPress={() => void signOut()} disabled={saving}/>
  </AuthFrame>;
}
