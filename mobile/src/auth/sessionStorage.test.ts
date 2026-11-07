import { setSessionValue, deleteSessionValue } from './sessionStorage';
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
