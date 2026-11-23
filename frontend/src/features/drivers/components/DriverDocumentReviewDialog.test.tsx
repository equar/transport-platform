// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DriverDocumentReviewDialog } from './DriverDocumentReviewDialog';
import { driversApi, type DriverDocumentRecord } from '../api/driversApi';
vi.mock('./PdfDocumentPreview', () => ({ PdfDocumentPreview: ({ onReady }: { onReady: () => void }) => <button onClick={onReady}>Render PDF test page</button> }));
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
  const image = await screen.findByAltText('Uploaded driver document');
  expect(image.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/);
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
it('renders an authenticated PDF without a frame and waits for rendering before review', async () => {
  vi.mocked(driversApi.downloadDocument).mockResolvedValue(new Blob(['%PDF-test'], { type: 'application/pdf' }));
  const view = render(<DriverDocumentReviewDialog open mode="verify" document={{ ...document, contentType: 'application/pdf' }} loading={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
  const renderPage = await screen.findByRole('button', { name: 'Render PDF test page' });
  expect(view.baseElement.querySelector('iframe')).toBeNull();
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(renderPage);
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(false);
  expect(screen.getByRole('link', { name: 'Download document' })).toBeTruthy();
});
it('refuses HTML responses even if document metadata claims the file is a PDF', async () => {
  vi.mocked(driversApi.downloadDocument).mockResolvedValue(new Blob(['<script>alert(1)</script>'], { type: 'text/html' }));
  render(<DriverDocumentReviewDialog open mode="verify" document={{ ...document, contentType: 'application/pdf' }} loading={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
  await screen.findByRole('button', { name: 'Retry preview' });
  expect(screen.queryByTitle('Uploaded driver document')).toBeNull();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
});
it('shows a rendering failure and requires opening the fallback before confirming review', async () => {
  render(<DriverDocumentReviewDialog open mode="verify" document={document} loading={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
  fireEvent.error(await screen.findByAltText('Uploaded driver document'));
  expect(screen.getByText(/preview couldn’t be displayed/)).toBeTruthy();
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('link', { name: 'Open full document' }));
  expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(false);
});
it('retries failed downloads and releases the document URL on close', async () => {
  vi.mocked(driversApi.downloadDocument).mockRejectedValueOnce(new Error('Network unavailable'));
  const view = render(<DriverDocumentReviewDialog open mode="verify" document={document} loading={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry preview' }));
  await screen.findByAltText('Uploaded driver document');
  expect(driversApi.downloadDocument).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:document');
});
