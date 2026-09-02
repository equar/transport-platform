import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function resolveSimulatorFallbackFlag() {
  const extraFlag =
    (Constants.expoConfig?.extra as { simulatorSessionStorage?: string } | undefined)
      ?.simulatorSessionStorage;
  const envFlag = process.env.EXPO_PUBLIC_SIMULATOR_SESSION_STORAGE;
  return (extraFlag ?? envFlag ?? '').toLowerCase() === 'true';
}

const allowSimulatorFallback = resolveSimulatorFallbackFlag();

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

// Tenant branding cache helpers
export async function getCachedTenantBranding(tenantId: string): Promise<string | null> {
  if (!tenantId) return null;
  const key = `tenant_branding_${tenantId}`;
  return getSessionValue(key);
}

export async function setCachedTenantBranding(tenantId: string, value: string): Promise<void> {
  if (!tenantId) return;
  const key = `tenant_branding_${tenantId}`;
  return setSessionValue(key, value);
}

export async function deleteCachedTenantBranding(tenantId: string): Promise<void> {
  if (!tenantId) return;
  const key = `tenant_branding_${tenantId}`;
  return deleteSessionValue(key);
}
