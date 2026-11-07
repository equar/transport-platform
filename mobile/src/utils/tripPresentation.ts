const FINISHED = new Set(['DROPPED_OFF', 'COMPLETED', 'CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW']);
export function isFinishedTrip(status: string) { return FINISHED.has(status); }
export function tripStatusLabel(status: string) {
  const labels: Record<string, string> = { DRIVER_EN_ROUTE: 'Driver on the way', PICKED_UP: 'On board', DROPPED_OFF: 'Dropped off', RIDER_NO_SHOW: 'No-show', PENDING_REVIEW: 'Under review' };
  return labels[status] ?? status.toLowerCase().replace(/_/g, ' ').replace(/^\w/, letter => letter.toUpperCase());
}
