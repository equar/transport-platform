import { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { apiClient, getApiErrorMessage, unwrapResponse } from '../../../shared/api/client';
import { postFinancialIntent } from '../../../shared/api/financialRequests';
import { serviceToday } from '../../../shared/utils/serviceTime';
import { PageCard } from '../../../shared/components/PageCard';
import type { DriverEarningsEntry } from '../api/driverEarningsApi';
interface Payout { id: number; driverId: number; amount: number; paidOn: string; reference: string; notes: string | null; reversed: boolean; reversalReason: string | null }
interface Account { approvedEarnings: number; paidAmount: number; outstanding: number; currency: string; payouts: Payout[] }
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function DriverPayouts({ entries }: { entries: DriverEarningsEntry[] }) {
  const drivers = [...new Map(entries.map(e => [e.driverId, e.driverName ?? `Driver #${e.driverId}`])).entries()];
  const [driver, setDriver] = useState(''), [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState(''), [date, setDate] = useState(serviceToday()), [reference, setReference] = useState(''), [notes, setNotes] = useState('');
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true; setAccount(null); setError('');
    if (driver) void apiClient.get(`/company/drivers/${driver}/payouts`).then(r => { if (active) setAccount(unwrapResponse<Account>(r.data)); })
      .catch(e => { if (active) setError(getApiErrorMessage(e, 'Payouts could not be loaded.')); });
    return () => { active = false; };
  }, [driver, entries]);
  async function record() {
    setBusy(true); setError('');
    try {
      setAccount(await postFinancialIntent<Account>('/company/driver-payouts', { driverId: Number(driver), amount: Number(amount), paidOn: date, reference: reference.trim(), notes: notes.trim() || null }));
      setAmount(''); setReference(''); setNotes('');
    } catch (e) { setError(getApiErrorMessage(e, 'Payout could not be recorded.')); } finally { setBusy(false); }
  }
  async function reverse(id: number) {
    setBusy(true); setError('');
    try { setAccount(await postFinancialIntent<Account>(`/company/driver-payouts/${id}/reverse`, { reason: reason.trim() })); setReason(''); }
    catch (e) { setError(getApiErrorMessage(e, 'Payout could not be reversed.')); } finally { setBusy(false); }
  }
  function download() {
    if (!account) return;
    const csv = (value: unknown) => `"${String(value ?? '').replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows: unknown[][] = [['Payout ID', 'Driver ID', 'Paid on', 'Amount USD', 'Reference', 'Status'], ...account.payouts.map(p => [p.id, p.driverId, p.paidOn, p.amount.toFixed(2), p.reference, p.reversed ? 'Reversed' : 'Paid'])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(csv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `driver-${driver}-payouts.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return <PageCard><Stack spacing={2}><Typography variant="h6">Manual payouts</Typography>
    <Typography color="text.secondary">Record money already paid outside Bakaroo. Approved earnings and payout history determine the outstanding balance.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField select label="Driver payout account" value={driver} disabled={busy} onChange={e => setDriver(e.target.value)}><MenuItem value="">Select a driver</MenuItem>{drivers.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}</TextField>
    {account && <>
      <Typography>Approved: {money(account.approvedEarnings)} · Paid: {money(account.paidAmount)} · Outstanding: {money(account.outstanding)}</Typography>
      {account.outstanding < 0 && <Alert severity="warning">Payouts exceed current approved earnings. Review the ledger and record an explicit correction.</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Payout amount (USD)" type="number" value={amount} onChange={e => setAmount(e.target.value)} inputProps={{ min: 0.01, step: 0.01 }} />
        <TextField label="Paid on" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Receipt or transfer reference" value={reference} onChange={e => setReference(e.target.value)} inputProps={{ maxLength: 150 }} />
      </Stack>
      <TextField label="Payout notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} inputProps={{ maxLength: 2000 }} />
      <Button variant="contained" onClick={() => void record()} disabled={busy || !date || !reference.trim() || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > account.outstanding}>Record manual payout</Button>
      <Stack direction="row" justifyContent="space-between"><Typography variant="h6">Payout history</Typography><Button onClick={download} disabled={!account.payouts.length}>Export CSV</Button></Stack>
      {account.payouts.length ? <>
        <TextField label="Reason for reversal" value={reason} onChange={e => setReason(e.target.value)} helperText="Required only when correcting a payout below." inputProps={{ maxLength: 2000 }} />
        {account.payouts.map(p => <Stack key={p.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between"><Typography>{p.paidOn} · {money(p.amount)} · {p.reference} · {p.reversed ? `Reversed: ${p.reversalReason}` : 'Paid'}</Typography>{!p.reversed && <Button color="warning" disabled={busy || !reason.trim()} onClick={() => void reverse(p.id)}>Reverse payout #{p.id}</Button>}</Stack>)}
      </> : <Typography>No payouts recorded.</Typography>}
    </>}
  </Stack></PageCard>;
}
