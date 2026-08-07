import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const allowSimulatorFallback =
  process.env.EXPO_PUBLIC_SIMULATOR_SESSION_STORAGE === 'true';

export async function getSessionValue(key: string): Promise<string | null> {
  try {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue || !allowSimulatorFallback) return secureValue;
  } catch (error) {
    if (!allowSimulatorFallback) throw error;
  }
  return AsyncStorage.getItem(key);
}

export async function setSessionValue(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    if (allowSimulatorFallback) await AsyncStorage.removeItem(key);
    return;
  } catch (error) {
    if (!allowSimulatorFallback) throw error;
  }
  await AsyncStorage.setItem(key, value);
}

export async function deleteSessionValue(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (!allowSimulatorFallback) throw error;
  }
  if (allowSimulatorFallback) await AsyncStorage.removeItem(key);
}
