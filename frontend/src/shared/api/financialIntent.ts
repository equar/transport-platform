import { apiClient, captureTenantRequestScope, unwrapResponse } from "./client";
const pending = new Map<string, string>();
/** Account-scoped, durable retry identity; no financial field values are persisted. */
export async function postFinancialAdjustment<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  const scope = captureTenantRequestScope();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify([path, payload])),
  );
  const hash = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  const storageKey = `adjustment-intent:${scope.key}:${hash}`;
  let key = pending.get(storageKey);
  try {
    key = sessionStorage.getItem(storageKey) ?? key;
  } catch {
    /* Memory fallback. */
  }
  key ??= crypto.randomUUID();
  pending.set(storageKey, key);
  try {
    sessionStorage.setItem(storageKey, key);
  } catch {
    /* Memory fallback. */
  }
  const response = await apiClient.post(path, payload, {
    ...scope.config,
    headers: { "Idempotency-Key": key },
  });
  if (pending.get(storageKey) === key) pending.delete(storageKey);
  try {
    if (sessionStorage.getItem(storageKey) === key)
      sessionStorage.removeItem(storageKey);
  } catch {
    /* Memory fallback. */
  }
  return unwrapResponse<T>(response.data);
}
