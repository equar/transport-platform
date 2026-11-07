let sequence = 0;

export function createIdempotencyKey(scope: string) {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 14);
  return `${scope}-${timestamp}-${sequence.toString(36)}-${random}`;
}