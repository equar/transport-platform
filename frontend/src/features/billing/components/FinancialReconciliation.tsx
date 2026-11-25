import { useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { apiClient, getApiErrorMessage, unwrapResponse } from '../../../shared/api/client';
import { PageCard } from '../../../shared/components/PageCard';
type Report = Record<string, Record<string, unknown>[]>;
export function FinancialReconciliation() {
  const [report, setReport] = useState<Report | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run() {
    setBusy(true); setError('');
    try { setReport(unwrapResponse<Report>((await apiClient.get('/company/billing/reconciliation')).data)); }
    catch (e) { setError(getApiErrorMessage(e, 'Reconciliation could not be loaded.')); } finally { setBusy(false); }
  }
  async function reconcile(invoice: unknown) {
    setBusy(true); setError('');
    try { await apiClient.post(`/company/invoices/${Number(invoice)}/reconcile-allocations`); await run(); }
    catch (e) { setError(getApiErrorMessage(e, 'Review overlapping charges and delivery evidence before reconciling allocations.')); } finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'billing-reconciliation.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <PageCard><Stack spacing={2}>
    <Typography variant="h6">Financial reconciliation</Typography>
    <Typography color="text.secondary">Check historical totals, overlapping charges, earnings allocations and payout balances. Checks are read-only; up to 200 exceptions per category are returned.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    <Stack direction="row" spacing={1}><Button disabled={busy} onClick={() => void run()}>Run reconciliation</Button>{report && <Button onClick={download}>Export findings</Button>}</Stack>
    {report && Object.entries(report).map(([kind, rows]) => <Stack key={kind} spacing={1}>
      <Typography>{kind.replaceAll('_', ' ')}: {rows.length}{rows.length === 200 ? '+' : ''} exceptions</Typography>
      {rows.map((row, n) => <Stack key={n} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{Object.entries(row).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value)}`).join(' · ')}</Typography>
        {kind === 'route_allocations_missing' && <Button disabled={busy} onClick={() => void reconcile(row.invoice_id)}>Reconcile allocations</Button>}
      </Stack>)}
    </Stack>)}
  </Stack></PageCard>;
}
