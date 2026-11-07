import { formatServiceDateTime, scheduleEpoch } from './serviceTime';
export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return formatServiceDateTime(iso, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return formatServiceDateTime(iso, { month: 'short', day: 'numeric', year: 'numeric' });
}
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return formatServiceDateTime(iso, { hour: 'numeric', minute: '2-digit', hour12: true });
}
export function timeUntil(iso: string | null | undefined): string {
  if (!iso) return '—';
  const epoch = scheduleEpoch(iso);
  if (epoch === null) return 'Service local time';
  const diff = epoch - Date.now();
  if (diff < 0) return 'Past';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}
