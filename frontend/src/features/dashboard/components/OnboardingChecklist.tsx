import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Checkbox, Link, Paper, Stack, Typography, Button } from '@mui/material';
import { useAuth } from '../../auth/context/AuthContext';
const steps = [
  ['Company settings', '/company/settings'],
  ['Submit transport compliance for approval', '/company/transport-compliance'],
  ['Invite operations staff', '/company/users'],
  ['Add drivers', '/company/drivers'],
  ['Add vehicles and compliance documents', '/company/vehicles'],
  ['Add riders and guardians', '/company/riders'],
  ['Create and dispatch the first ride', '/company/rides'],
];
export function OnboardingChecklist() {
  const { session } = useAuth();
  const key = `onboarding:${session?.identity.tenantId}:${session?.identity.id}`;
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; } });
  const [expanded, setExpanded] = useState(done.length !== steps.length);
  function toggle(title: string) {
    const next = done.includes(title) ? done.filter(value => value !== title) : [...done, title];
    setDone(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* completion is still usable for this session */ }
  }
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1}>
    <Typography variant="h6">Set up your transport operation • {done.length}/{steps.length}</Typography>
    <Typography variant="body2">Follow these steps and mark each complete when ready. Dispatch remains blocked until transport compliance is approved.</Typography>
    <Button onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide checklist' : 'Show checklist'}</Button>
    {expanded ? steps.map(([title, path]) => <Stack key={title} direction="row" alignItems="center"><Checkbox checked={done.includes(title)} onChange={() => toggle(title)} inputProps={{ 'aria-label': `Mark ${title} complete` }} /><Link component={RouterLink} to={path}>{title}</Link></Stack>) : null}
  </Stack></Paper>;
}
