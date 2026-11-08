import React, { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton, AppInput } from './ui';
import { Colors, Spacing } from '@theme/tokens';

export interface DocumentMetadata {
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
}
export function documentMetadataError(value: DocumentMetadata): string | null {
  if (!value.documentNumber.trim() || !value.issuingAuthority.trim() || !value.issueDate || !value.expiryDate) {
    return 'Enter the document number, issuing authority, issue date, and expiry date.';
  }
  for (const date of [value.issueDate, value.expiryDate]) {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return 'Enter valid dates in YYYY-MM-DD format.';
    }
  }
  if (value.expiryDate < value.issueDate) return 'Expiry date cannot be earlier than issue date.';
  return null;
}
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const parsed = new Date(`${value}T12:00:00`);
  return <View style={{ gap: Spacing.xs }}>
    <AppInput label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" maxLength={10} />
    <AppButton label={`Choose ${label.toLowerCase()}`} variant="outlined" onPress={() => setOpen(true)} />
    {open && Platform.OS !== 'web' ? <DateTimePicker mode="date" value={Number.isFinite(parsed.getTime()) ? parsed : new Date()}
      onChange={(event, date) => {
        setOpen(false);
        if (event.type === 'set' && date) onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
      }} /> : null}
  </View>;
}
export function DriverDocumentUploadForm({ fileName, documentType, uploading, onCancel, onSubmit }: {
  fileName: string; documentType: string; uploading: boolean; onCancel: () => void;
  onSubmit: (metadata: DocumentMetadata) => Promise<void>;
}) {
  const [metadata, setMetadata] = useState<DocumentMetadata>({ documentNumber: '', issuingAuthority: '', issueDate: '', expiryDate: '' });
  const [error, setError] = useState<string | null>(null);
  const update = (field: keyof DocumentMetadata, value: string) => { setMetadata(previous => ({ ...previous, [field]: value })); setError(null); };
  async function submit() {
    const problem = documentMetadataError(metadata); setError(problem);
    if (!problem) await onSubmit(metadata);
  }
  return <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    contentContainerStyle={{ padding: Spacing.lg, paddingTop: 56, paddingBottom: 48, gap: Spacing.md }}
    style={{ backgroundColor: Colors.background }}>
    <Text accessibilityRole="header" style={{ fontSize: 22, color: Colors.textPrimary }}>Document details</Text>
    <Text style={{ color: Colors.textPrimary }}>{documentType.replace(/_/g, ' ')} · {fileName}</Text>
    <Text style={{ color: Colors.textSecondary }}>Enter the details shown on your document so your transport provider can check them against the uploaded file.</Text>
    <AppInput label="Document number" value={metadata.documentNumber} onChangeText={v => update('documentNumber', v)} maxLength={120} />
    <AppInput label="Issuing authority" value={metadata.issuingAuthority} onChangeText={v => update('issuingAuthority', v)} maxLength={150} />
    <DateField label="Issue date" value={metadata.issueDate} onChange={v => update('issueDate', v)} />
    <DateField label="Expiry date" value={metadata.expiryDate} onChange={v => update('expiryDate', v)} />
    {error ? <Text accessibilityRole="alert" style={{ color: Colors.error }}>{error}</Text> : null}
    <AppButton label="Submit for review" onPress={() => void submit()} loading={uploading} disabled={uploading} />
    <AppButton label="Cancel" variant="outlined" onPress={onCancel} disabled={uploading} />
  </ScrollView>;
}
