import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import DriverCompliancePage from '../../../app/(driver)/compliance';
import { driverPortalApi } from '@api/driverPortalApi';
const mockRefetch = jest.fn().mockResolvedValue({});
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ isLoading: false, isError: false, data: { documents: [], issues: [] }, refetch: mockRefetch }) }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: { getComplianceSummary: jest.fn(), uploadDocument: jest.fn().mockResolvedValue({}) } }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///license.pdf', name: 'license.pdf', mimeType: 'application/pdf', size: 100 }] }) }));
jest.mock('@react-native-community/datetimepicker', () => 'DatePicker');
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
it('waits for metadata before uploading the selected file', async () => {
  render(<DriverCompliancePage />);
  fireEvent.press(screen.getByRole('button', { name: 'Upload document' }));
  fireEvent.press(screen.getByRole('button', { name: 'Driver license' }));
  await screen.findByText('Document details');
  expect(driverPortalApi.uploadDocument).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('Document number'), 'DL-123');
  fireEvent.changeText(screen.getByLabelText('Issuing authority'), 'State DMV');
  fireEvent.changeText(screen.getByLabelText('Issue date'), '2026-11-08');
  fireEvent.changeText(screen.getByLabelText('Expiry date'), '2027-11-08');
  fireEvent.press(screen.getByRole('button', { name: 'Submit for review' }));
  await waitFor(() => expect(driverPortalApi.uploadDocument).toHaveBeenCalledWith(expect.objectContaining({
    documentType: 'DRIVER_LICENSE', documentNumber: 'DL-123', issuingAuthority: 'State DMV',
    issueDate: '2026-11-08', expiryDate: '2027-11-08', uri: 'file:///license.pdf',
  })));
  await screen.findByText('Document submitted');
});
