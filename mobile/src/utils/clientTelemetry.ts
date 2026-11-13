import Constants from 'expo-constants';
type TelemetryLevel = 'info' | 'warn' | 'error';

type TelemetryDetails = Record<string, unknown>;

const SENSITIVE_KEYS = ['authorization', 'password', 'token', 'secret', 'cookie', 'set-cookie'];

function scrubValue(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(scrubValue);
  if (typeof value !== 'object') return value;

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(input)) {
    const normalized = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive))) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = scrubValue(raw);
  }
  return output;
}

export function logClientEvent(level: TelemetryLevel, event: string, details?: TelemetryDetails) {
  const base = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (typeof fetch === 'function' && level !== 'info' && base?.startsWith('https://') && /^[a-zA-Z0-9._-]{1,100}$/.test(event)) {
    void fetch(`${base.replace(/\/$/, '')}/client-events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, level, client: 'mobile', release: Constants.expoConfig?.version ?? 'unknown' }) }).catch(() => undefined);
  }
  const payload = {
    event,
    at: new Date().toISOString(),
    details: details ? scrubValue(details) : undefined,
  };

  if (level === 'error') {
    console.error('[mobile]', payload);
    return;
  }
  if (level === 'warn') {
    console.warn('[mobile]', payload);
    return;
  }
  console.info('[mobile]', payload);
}
