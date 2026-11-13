import { useEffect, useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { apiClient, getApiErrorMessage, unwrapResponse } from '../../../shared/api/client';
import { PageCard } from '../../../shared/components/PageCard';
import { useAuth } from '../context/AuthContext';

export function AuthenticatorCard() {
  const { signOut } = useAuth();
  const [status, setStatus] = useState<{ enabled: boolean; available: boolean; required: boolean } | null>(null);
  const [secret, setSecret] = useState<{ secret: string; account: string; expiresAt: string } | null>(null);
  const [recovery, setRecovery] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function load() { void apiClient.get('/v1/auth/mfa').then(r => setStatus(unwrapResponse(r.data))).catch(e => setError(getApiErrorMessage(e, 'Authenticator settings unavailable.'))); }
  useEffect(load, []);
  async function act(action: 'setup' | 'activate' | 'disable') {
    setBusy(true); setError(null);
    try {
      const result = await apiClient.post(`/v1/auth/mfa/${action}`, { password, code });
      if (action === 'setup') { setSecret(unwrapResponse(result.data)); setCode(''); }
      else if (action === 'activate') { setRecovery(unwrapResponse<{ recoveryCodes: string[] }>(result.data).recoveryCodes); setSecret(null); setPassword(''); setCode(''); }
      else { setPassword(''); setCode(''); signOut(); }
    } catch (e) { setError(getApiErrorMessage(e, 'The authenticator change could not be completed.')); }
    finally { setBusy(false); }
  }
  return <PageCard><Stack spacing={2}>
    <Typography variant="h5">Authenticator protection</Typography>
    {error ? <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>{error}</Alert> : null}
    {recovery.length ? <>
      <Alert severity="success">Authenticator enabled. Save these single-use recovery codes somewhere private before signing in again. They cannot be displayed again.</Alert>
      <TextField label="Recovery codes" value={recovery.join('\n')} multiline minRows={8} InputProps={{ readOnly: true }} />
      <Button variant="contained" onClick={() => { setRecovery([]); signOut(); }}>I saved my recovery codes — sign in again</Button>
    </> : <>
      <Typography>{status?.enabled ? 'Your account requires an authenticator code or unused recovery code at sign-in.' : 'Use an authenticator app to add a separate sign-in factor.'}</Typography>
      {status && !status.available ? <Alert severity="info">Enrollment needs to be configured by your platform administrator.</Alert> : null}
      {status?.available ? <>
        <TextField label="Current password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
        {secret ? <>
          <Alert severity="info">In your authenticator app, add a time-based account named Bakaroo ({secret.account}) using this setup key. Confirm within five minutes.</Alert>
          <TextField label="Private setup key" value={secret.secret} InputProps={{ readOnly: true }} />
        </> : null}
        {secret || status.enabled ? <TextField label="Authenticator or recovery code" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} inputProps={{ maxLength: 32 }} disabled={busy} /> : null}
        {!status.enabled ? <Button variant="contained" disabled={busy || !password || (!!secret && !code)} onClick={() => void act(secret ? 'activate' : 'setup')}>{busy ? 'Working…' : secret ? 'Confirm authenticator' : 'Set up authenticator'}</Button>
          : !status.required ? <Button color="error" disabled={busy || !password || !code} onClick={() => void act('disable')}>Disable authenticator and sign out</Button> : <Typography>Authenticator protection is required by your administrator.</Typography>}
      </> : null}
    </>}
  </Stack></PageCard>;
}
