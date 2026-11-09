import { useEffect, useId, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { brandingApi, type TenantThemeState } from '../api/brandingApi';

export function TenantThemePicker({ tenantId, onApplied }: { tenantId?: string; onApplied?: () => Promise<void> }) {
  const groupId = useId();
  const [state, setState] = useState<TenantThemeState | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setState(null); setError(null); setSaved(false);
    void brandingApi.get(tenantId).then(result => { if (active) { setState(result); setSelected(result.selectedCode); } })
      .catch(() => { if (active) setError('Tenant themes could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tenantId, attempt]);
  async function apply() {
    if (!state?.eligible || saving) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const result = await brandingApi.apply(selected, tenantId);
      setState(result); setSaved(true);
      try { await onApplied?.(); } catch { setError('Theme saved. Refresh this page to load the updated appearance.'); }
    } catch { setError('The theme could not be applied. Confirm tenant verification and try again.'); }
    finally { setSaving(false); }
  }
  if (loading) return <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} /><Typography>Loading tenant themes…</Typography></Stack>;
  return <Stack spacing={2}>
    <Typography variant="h5" id={groupId}>Tenant appearance</Typography>
    <Typography color="text.secondary">Choose a coordinated look for {state?.companyName || 'this tenant'}. Classic Blue keeps the platform default. Your company name and logo stay in place.</Typography>
    {error ? <Alert severity="error" action={!state ? <Button onClick={() => setAttempt(value => value + 1)}>Retry</Button> : undefined}>{error}</Alert> : null}
    {state && !state.eligible ? <Alert severity="info">{state.eligibilityMessage}</Alert> : null}
    {state?.selectedCode === 'CUSTOM' ? <Alert severity="info">This tenant has existing custom colors. They remain active until you apply a predefined theme.</Alert> : null}
    {saved ? <Alert severity="success">Theme applied to {state?.companyName}.</Alert> : null}
    {state ? <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
      <Button variant="outlined" size="small" onClick={() => setSelected('DEFAULT')} disabled={saving || selected === 'DEFAULT'}>Reset to default</Button>
    </Stack> : null}
    <RadioGroup aria-labelledby={groupId} value={selected} onChange={event => { setSelected(event.target.value); setSaved(false); }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' } }}>
        {state?.themes.map(theme => <Paper key={theme.code} component="label" variant="outlined" sx={{ p: 2, minWidth: 0, cursor: saving ? 'default' : 'pointer', borderWidth: 2,
          borderColor: selected === theme.code ? theme.primaryColor : 'divider', '&:focus-within': { outline: `3px solid ${theme.primaryColor}`, outlineOffset: 2 } }}>
          <Stack direction="row" alignItems="center"><Radio value={theme.code} disabled={saving} inputProps={{ 'aria-label': theme.name }} sx={{ color: theme.primaryColor, '&.Mui-checked': { color: theme.primaryColor } }} />
            <Typography component="span" fontWeight={700}>{theme.name}</Typography>
            {state.selectedCode === theme.code ? <Typography component="span" variant="caption" sx={{ ml: 'auto' }}>Applied</Typography> : null}
          </Stack>
          <Box aria-hidden="true" sx={{ display: 'flex', height: 110, borderRadius: 1, overflow: 'hidden', border: '1px solid #e4e8ed', mb: 1 }}>
            <Box sx={{ width: 30, bgcolor: theme.secondaryColor, borderTop: `5px solid ${theme.accentColor}` }} />
            <Box sx={{ flex: 1, p: 1.25, bgcolor: '#f8fafc' }}>
              <Box sx={{ height: 5, width: '55%', bgcolor: theme.primaryColor, borderRadius: 1, mb: 1 }} />
              <Box sx={{ bgcolor: '#fff', border: '1px solid #e4e8ed', borderRadius: 1, px: 1, py: .5, mb: 1, color: '#172b40', fontSize: 11 }}>Upcoming trips</Box>
              <Box sx={{ display: 'inline-block', bgcolor: theme.primaryColor, color: '#fff', px: 1.25, py: .35, borderRadius: .75, fontSize: 11 }}>View rides</Box>
            </Box>
          </Box>
          <Typography component="span" variant="body2" color="text.secondary">{theme.description}</Typography>
        </Paper>)}
      </Box>
    </RadioGroup>
    {state ? <Button variant="contained" onClick={() => void apply()} disabled={!state.eligible || saving || selected === state.selectedCode || !state.themes.some(theme => theme.code === selected)} sx={{ alignSelf: 'flex-start' }}>
      {saving ? 'Applying theme…' : 'Apply selected theme'}
    </Button> : null}
  </Stack>;
}
