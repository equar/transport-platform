import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View, Platform } from 'react-native';
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
    if (!current || password.length < 8 || password.length > 100 || password !== confirmation) {
      setError('Enter your current password and matching new passwords of 8–100 characters.'); return;
    }
    setSaving(true); setError('');
    try { await authApi.changePassword({ currentPassword: current, newPassword: password }); await signOut(); }
    catch { setError('Password could not be changed. Check your current password and try again.'); }
    finally { setSaving(false); }
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f5f7fa' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled"><View style={{ gap: 20, width: '100%', maxWidth: 460, alignSelf: 'center' }}><Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '700', color: '#172b40' }}>Choose your own password</Text><Text style={{ color: '#667384', lineHeight: 22 }}>Your administrator requires a new password before you can access trips or personal information. You’ll sign in again after this change.</Text>{!!error && <Text accessibilityRole="alert" style={{ color: '#b42318' }}>{error}</Text>}<AppInput label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password"/><AppInput label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password"/><AppInput label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password"/><AppButton label="Update password" onPress={() => void save()} loading={saving}/><AppButton label="Sign out" variant="ghost" onPress={() => void signOut()} disabled={saving}/></View></ScrollView></KeyboardAvoidingView>;
}
