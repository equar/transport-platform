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

function storageUnavailable(): Error {
  return new Error('We couldn’t securely save your sign-in. Try again. If this continues, contact your transport provider.');
}

const allowSimulatorFallback = __DEV__ && resolveSimulatorFallbackFlag();

export async function getSessionValue(key: string): Promise<string | null> {
  try {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue || !allowSimulatorFallback) return secureValue;
  } catch {
    if (!allowSimulatorFallback) throw storageUnavailable();
  }
  return AsyncStorage.getItem(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    if (allowSimulatorFallback) await AsyncStorage.removeItem(key);
    return;
  } catch {
    if (!allowSimulatorFallback) throw storageUnavailable();
  }
  await AsyncStorage.setItem(key, value);
}

async function removeValue(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    if (!allowSimulatorFallback) throw storageUnavailable();
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

const pendingWrites = new Map<string, Promise<void>>();
function serialize(key: string, mutation: () => Promise<void>): Promise<void> {
  const next = (pendingWrites.get(key) ?? Promise.resolve()).catch(() => undefined).then(mutation);
  pendingWrites.set(key, next);
  const cleanup = () => { if (pendingWrites.get(key) === next) pendingWrites.delete(key); };
  next.then(cleanup, cleanup);
  return next;
}
export function setSessionValue(key: string, value: string): Promise<void> { return serialize(key, () => writeValue(key, value)); }
export function deleteSessionValue(key: string): Promise<void> { return serialize(key, () => removeValue(key)); }
