import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { driverPortalApi } from '../api/driverPortalApi';

const types = ['DRIVER_LICENSE', 'BACKGROUND_CHECK', 'DRUG_TEST', 'CPR_FIRST_AID', 'NEMT_CERTIFICATION', 'SCHOOL_TRANSPORT_PERMIT', 'INSURANCE_PROOF', 'CONTRACT_AGREEMENT', 'OTHER'];
export function DriverDocumentUploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => Promise<void> }) {
  const [documentType, setType] = useState('DRIVER_LICENSE');
  const [file, setFile] = useState<File | null>(null);
  const [number, setNumber] = useState(''); const [authority, setAuthority] = useState('');
  const [issued, setIssued] = useState(''); const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!file || !number.trim() || !authority.trim() || !issued || !expires) { setError('Select a file and complete all document details.'); return; }
    if (expires < issued) { setError('Expiry date cannot be earlier than issue date.'); return; }
    if (file.size > 10 * 1024 * 1024 || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
      setError('Choose a PDF, JPEG, or PNG that is 10 MB or smaller.'); return;
    }
    setBusy(true); setError(null);
    try {
      await driverPortalApi.uploadDocument(file, { documentType, documentNumber: number.trim(), issuingAuthority: authority.trim(), issueDate: issued, expiryDate: expires });
    } catch { setError('The document could not be submitted. Check the details and try again.'); setBusy(false); return; }
    // Upload success is final even if refreshing the summary fails; never encourage duplicate submission.
    await onUploaded(); onClose();
  }
  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Submit a document</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Typography>Enter the details shown on the uploaded document for your transport provider to review.</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField select label="Document type" value={documentType} onChange={e => setType(e.target.value)} disabled={busy}>
        {types.map(type => <MenuItem key={type} value={type}>{type.replaceAll('_', ' ')}</MenuItem>)}
      </TextField>
      <Button component="label" variant="outlined" disabled={busy}>Select file
        <input aria-label="Document file" type="file" hidden accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </Button>
      {file ? <Typography>{file.name}</Typography> : null}
      <TextField required label="Document number" value={number} onChange={e => setNumber(e.target.value)} inputProps={{ maxLength: 120 }} disabled={busy} />
      <TextField required label="Issuing authority" value={authority} onChange={e => setAuthority(e.target.value)} inputProps={{ maxLength: 150 }} disabled={busy} />
      <TextField required label="Issue date" type="date" InputLabelProps={{ shrink: true }} value={issued} onChange={e => setIssued(e.target.value)} disabled={busy} />
      <TextField required label="Expiry date" type="date" InputLabelProps={{ shrink: true }} value={expires} onChange={e => setExpires(e.target.value)} disabled={busy} />
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={() => void submit()} disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</Button></DialogActions>
  </Dialog>;
}
