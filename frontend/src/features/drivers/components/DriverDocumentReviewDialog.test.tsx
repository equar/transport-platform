// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DriverDocumentReviewDialog } from './DriverDocumentReviewDialog';
import { driversApi, type DriverDocumentRecord } from '../api/driversApi';
vi.mock('../api/driversApi', () => ({ driversApi: { downloadDocument: vi.fn() } }));
const document = { id: 10, documentType: 'DRIVER_LICENSE', fileName: 'stored.jpg', originalFileName: 'license.jpg',
  contentType: 'image/jpeg', storagePath: 'tenant/driver/stored.jpg', documentNumber: 'DL-123', issuingAuthority: 'State DMV',
  issueDate: '2026-11-08', expiryDate: '2027-11-08', notes: null, updatedAt: '2026-11-08T14:00:00Z' } as DriverDocumentRecord;
beforeEach(() => {
  URL.createObjectURL = vi.fn().mockReturnValue('blob:document'); URL.revokeObjectURL = vi.fn();
  vi.mocked(driversApi.downloadDocument).mockResolvedValue(new Blob(['image'], { type: 'image/jpeg' }));
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('shows submitted fields and the protected file, and requires a review confirmation', async () => {
  const submit = vi.fn().mockResolvedValue(undefined);
  render(<DriverDocumentReviewDialog open mode="verify" document={document} loading={false} onClose={vi.fn()} onSubmit={submit} />);
  await screen.findByAltText('Uploaded driver document');
  expect(screen.getByText('Document number: DL-123')).toBeTruthy();
  expect(screen.getByText('Issuing authority: State DMV')).toBeTruthy();
  expect(screen.getByText('Issue date: 2026-11-08')).toBeTruthy();
  expect(screen.getByText('Expiry date: 2027-11-08')).toBeTruthy();
  const verify = screen.getByRole('button', { name: 'Verify Document' });
  expect((verify as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(verify);
  await waitFor(() => expect(submit).toHaveBeenCalledWith(''));
  expect(driversApi.downloadDocument).toHaveBeenCalledWith(10);
});
it('prevents verifying incomplete legacy metadata', async () => {
  render(<DriverDocumentReviewDialog open mode="verify" document={{ ...document, documentNumber: null }} loading={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
  await screen.findByAltText('Uploaded driver document');
  expect(screen.getByText(/Required details are missing/)).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Verify Document' }) as HTMLButtonElement).disabled).toBe(true);
});
