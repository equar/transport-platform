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
  publicSiteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL || (import.meta.env.DEV ? 'http://localhost:3007' : 'https://transport.bakaroo.com')).replace(/\/$/, ''),
  adminSiteUrl: (import.meta.env.VITE_ADMIN_SITE_URL || (import.meta.env.DEV ? 'http://localhost:3008' : 'https://admin.transport.bakaroo.com')).replace(/\/$/, ''),
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  googleMapsApiKey: readMapsApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
} as const;
