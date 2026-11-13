/** Cookies are shared by tabs, so rotation/login/logout share one browser lock. */
export async function withSessionCookieLock<T>(operation: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request('transport-session-cookie', operation);
  return operation();
}
