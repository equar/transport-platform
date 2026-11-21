import { getSessionValue, setSessionValue, deleteSessionValue } from './sessionStorage';
import storage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }));
it('orders a late refresh write, logout removal and new-account write deterministically', async () => {
  let finish!: () => void;
  const calls: string[] = [];
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(() => new Promise<void>(resolve => { calls.push('old'); finish = resolve; }))
    .mockImplementationOnce(async () => { calls.push('new'); });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async () => { calls.push('clear'); });
  const old = setSessionValue('auth_session', 'old');
  const clear = deleteSessionValue('auth_session');
  const next = setSessionValue('auth_session', 'new');
  for (let i = 0; i < 5; i++) await Promise.resolve();
  expect(calls).toEqual(['old']);
  finish(); await Promise.all([old, clear, next]);
  expect(calls).toEqual(['old', 'clear', 'new']);
});

it('does not expose native Keychain details or write credentials to plain storage on failure', async () => {
  const nativeError = new Error("KeyChainException: A required entitlement isn’t present (SecureStoreModule.swift:123)");
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(nativeError);
  await expect(setSessionValue('auth_session', 'private-token')).rejects.toThrow('Secure sign-in storage is unavailable.');
  expect(storage.setItem).not.toHaveBeenCalled();
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(nativeError);
  await expect(getSessionValue('auth_session')).rejects.not.toThrow('SecureStoreModule.swift');
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(nativeError);
  await expect(deleteSessionValue('auth_session')).rejects.toThrow('Secure sign-in storage is unavailable.');
});
