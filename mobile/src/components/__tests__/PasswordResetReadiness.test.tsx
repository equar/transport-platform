import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ResetPassword from '../../../app/(auth)/reset-password';
import { authApi } from '@api/authApi';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ token: 'reset-token' }), useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('@api/authApi', () => ({ authApi: { resetPassword: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
beforeEach(() => jest.clearAllMocks());
it('accepts a matching password within the existing backend contract', async () => {
  jest.mocked(authApi.resetPassword).mockResolvedValueOnce('Password updated');
  render(<ResetPassword />);
  fireEvent.changeText(screen.getByLabelText('New password'), 'safe12345');
  fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'safe12345');
  fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledWith('reset-token', 'safe12345'));
  await screen.findByText('Password updated');
});
it('rejects passwords outside the backend length limit without sending the request', () => {
  render(<ResetPassword />);
  fireEvent.changeText(screen.getByLabelText('New password'), 'a'.repeat(101));
  fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'a'.repeat(101));
  fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  expect(authApi.resetPassword).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('This password is too long. Try a shorter one.');
});
