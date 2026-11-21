import { crashDetails } from './crashDetails';
import { env } from '../config/env';
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

function diagnosticDetails(details?: TelemetryDetails) {
  if (!details || typeof details.fingerprint !== 'string' || !/^[a-f0-9]{8}$/.test(details.fingerprint)) return {};
  const safe = crashDetails({ name: details.errorType, stack: details.frames });
  return { fingerprint: details.fingerprint, errorType: safe.errorType, frames: safe.frames };
}

export function logClientEvent(level: TelemetryLevel, event: string, details?: TelemetryDetails) {
  if (typeof fetch === 'function' && level !== 'info' && /^[a-zA-Z0-9._-]{1,100}$/.test(event)) {
    void fetch(`${env.apiBaseUrl}/client-events`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, level, client: 'web', release: import.meta.env.VITE_RELEASE_ID ?? 'development', ...diagnosticDetails(details) }), keepalive: true }).catch(() => undefined);
  }
  const payload = {
    event,
    at: new Date().toISOString(),
    details: details ? scrubValue(details) : undefined,
  };

  if (level === 'error') {
    console.error('[frontend]', payload);
    return;
  }
  if (level === 'warn') {
    console.warn('[frontend]', payload);
    return;
  }
  console.info('[frontend]', payload);
}
