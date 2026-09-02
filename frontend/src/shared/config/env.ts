function normalizeApiBaseUrl(value: string | undefined) {
  const resolved = (value ?? '/api').trim();
  if (resolved.length === 0) {
    return '/api';
  }
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
}

function readMapsApiKey(value: string | undefined) {
  return (value ?? '').trim();
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  googleMapsApiKey: readMapsApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
} as const;
