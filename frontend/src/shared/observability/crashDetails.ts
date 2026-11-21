/** Only build frame locations are transmitted; error messages, URLs and business data are excluded. */
export function crashDetails(error: unknown) {
  const candidate = error as { name?: unknown; stack?: unknown } | null;
  const allowed = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'AggregateError']);
  const errorType = typeof candidate?.name === 'string' && allowed.has(candidate.name) ? candidate.name : 'Error';
  const stack = typeof candidate?.stack === 'string' ? candidate.stack : '';
  const frames = [...stack.matchAll(/([A-Za-z0-9_.-]+\.(?:js|jsx|ts|tsx|hbc)):(\d+):(\d+)/g)]
    .slice(0, 8).map(match => `${match[1]}:${match[2]}:${match[3]}`).join(',').slice(0, 500);
  let hash = 2166136261;
  for (const character of `${errorType}|${frames}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return { errorType, frames, fingerprint: (hash >>> 0).toString(16).padStart(8, '0') };
}
