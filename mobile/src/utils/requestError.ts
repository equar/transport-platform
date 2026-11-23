/** Safe, actionable defaults for failures without a user-facing API message. */
export function requestErrorMessage(error: unknown, fallback = 'Please try again. If this continues, contact your transport provider.'): string {
  const e = error as { response?: { status?: number; headers?: Record<string, unknown>; data?: { error?: { message?: unknown; details?: { fieldErrors?: Record<string, unknown>; retryAfterSeconds?: unknown } } } }; code?: string; message?: string } | null;
  const status = e?.response?.status;
  if (e?.code === 'ERR_CANCELED') return 'This request was cancelled. Open the screen again to continue.';
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') return 'The request timed out. Check your connection and try again.';
  if (e?.code === 'ERR_NETWORK' || (!e?.response && e?.message === 'Network Error')) return 'You’re offline or the service can’t be reached. Check your connection and try again.';
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 404) return 'This item is no longer available. Go back and refresh the list.';
  const details = e?.response?.data?.error?.details;
  const retry = Number(e?.response?.headers?.['retry-after'] ?? details?.retryAfterSeconds);
  if (status === 429 && Number.isFinite(retry) && retry > 0) return `Too many requests. Try again in ${Math.ceil(retry)} seconds.`;
  if (status === 400 || status === 422) {
    const fields = Object.values(details?.fieldErrors ?? {}).filter((value): value is string => typeof value === 'string' && value.length <= 200);
    if (fields.length) return [...new Set(fields)].slice(0, 3).join(' ');
  }
  if (status && status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
  const message = e?.response?.data?.error?.message;
  if (typeof message === 'string' && message.trim() && message.length <= 500) return message;
  if (status === 403) return 'Your account can’t access this item. Contact your transport provider if you need access.';
  if (status === 409) return 'This item has changed. Refresh it before trying again.';
  if (status === 429) return 'Too many requests. Wait a moment, then try again.';
  if (status === 400 || status === 422) return 'Check the information you entered and try again.';
  return fallback;
}
