// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DriverDocumentUploadDialog } from './DriverDocumentUploadDialog';
import { driverPortalApi } from '../api/driverPortalApi';
vi.mock('../api/driverPortalApi', () => ({ driverPortalApi: { uploadDocument: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('submits the uploaded file together with its required metadata', async () => {
  vi.mocked(driverPortalApi.uploadDocument).mockResolvedValue({} as never);
  const refreshed = vi.fn().mockResolvedValue(undefined); const close = vi.fn();
  render(<DriverDocumentUploadDialog onClose={close} onUploaded={refreshed} />);
  fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
  expect(driverPortalApi.uploadDocument).not.toHaveBeenCalled();
  const file = new File(['%PDF-1.4'], 'license.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('Document file'), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText(/Document number/), { target: { value: 'DL-123' } });
  fireEvent.change(screen.getByLabelText(/Issuing authority/), { target: { value: 'State DMV' } });
  fireEvent.change(screen.getByLabelText(/Issue date/), { target: { value: '2026-11-08' } });
  fireEvent.change(screen.getByLabelText(/Expiry date/), { target: { value: '2027-11-08' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
  await waitFor(() => expect(driverPortalApi.uploadDocument).toHaveBeenCalledWith(file, {
    documentType: 'DRIVER_LICENSE', documentNumber: 'DL-123', issuingAuthority: 'State DMV', issueDate: '2026-11-08', expiryDate: '2027-11-08',
  }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(refreshed).toHaveBeenCalled();
});
