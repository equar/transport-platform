import { useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { subscriptionBillingApi, type SubscriptionInvoice, type BillingPayment, type SubscriptionAdjustment } from '../api/subscriptionBillingApi';
import { getApiErrorMessage } from '../../../shared/api/client';
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function SubscriptionAdjustments({ invoice, payments, adjustments = [], editable, onChanged }: {
  invoice: SubscriptionInvoice; payments: BillingPayment[]; adjustments?: SubscriptionAdjustment[]; editable: boolean; onChanged: () => Promise<void>;
}) {
  const [kind, setKind] = useState('CREDIT'), [payment, setPayment] = useState(''), [amount, setAmount] = useState('');
  const [reference, setReference] = useState(''), [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const cash = kind === 'REFUND' || kind === 'PAYMENT_REVERSAL';
  async function submit() {
    setBusy(true); setError('');
    try {
      await subscriptionBillingApi.adjust(invoice.id, { kind, paymentId: cash ? Number(payment) : null, amount: Number(amount), reference: reference.trim(), reason: reason.trim() });
      setAmount(''); setReference(''); setReason(''); await onChanged();
    } catch (e) { setError(getApiErrorMessage(e, 'Subscription adjustment could not be recorded.')); } finally { setBusy(false); }
  }
  return <Stack spacing={2}>
    <Typography>Original charges: {money(invoice.originalAmount ?? invoice.amount)} · Credits: {money(invoice.creditedAmount ?? 0)} · Net charges: {money(invoice.amount)}</Typography>
    <Typography variant="h6">Corrections and refunds</Typography>
    {adjustments.length ? adjustments.map(a => <Typography key={a.id}>{a.kind.replaceAll('_', ' ')} · {money(a.amount)} · {a.reference} · {a.reason}</Typography>) : <Typography>No corrections recorded.</Typography>}
    {editable && <>
      <Alert severity="info">These are manual accounting records. Record a refund only after returning funds outside Bakaroo. A refund reopens the balance; use a separate credit when the charge itself is cancelled.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField select label="Correction type" value={kind} onChange={e => { setKind(e.target.value); setPayment(''); }} disabled={busy}>
        <MenuItem value="CREDIT">Credit unpaid charges</MenuItem><MenuItem value="CREDIT_REVERSAL">Reverse a credit</MenuItem>
        <MenuItem value="REFUND">Record funds refunded</MenuItem><MenuItem value="PAYMENT_REVERSAL">Reverse an incorrect receipt</MenuItem>
      </TextField>
      {cash && <TextField select label="Original payment" value={payment} onChange={e => setPayment(e.target.value)} disabled={busy}><MenuItem value="">Select payment</MenuItem>{payments.filter(p => p.source === 'MANUAL').map(p => <MenuItem key={p.id} value={p.id}>{p.paymentReference} · {money(p.amount)}</MenuItem>)}</TextField>}
      <TextField label="Correction amount (USD)" type="number" value={amount} onChange={e => setAmount(e.target.value)} inputProps={{ min: 0.01, step: 0.01 }} disabled={busy} />
      <TextField label="Unique correction or refund reference" value={reference} onChange={e => setReference(e.target.value)} inputProps={{ maxLength: 150 }} disabled={busy} />
      <TextField label="Reason" multiline minRows={2} value={reason} onChange={e => setReason(e.target.value)} inputProps={{ maxLength: 2000 }} disabled={busy} />
      <Button variant="contained" disabled={busy || (cash && !payment) || !reference.trim() || !reason.trim() || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0} onClick={() => void submit()}>Record manual correction</Button>
    </>}
  </Stack>;
}
