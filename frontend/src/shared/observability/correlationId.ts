const HEADER_NAME = 'X-Correlation-Id';

function randomSegment() {
  return Math.random().toString(36).slice(2, 10);
}

export function buildCorrelationId() {
  return `${Date.now().toString(36)}-${randomSegment()}-${randomSegment()}`;
}

export function getCorrelationHeaderName() {
  return HEADER_NAME;
}
