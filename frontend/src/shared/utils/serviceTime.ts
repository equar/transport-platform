// Zone-less API schedules are wall-clock times at the transport provider.
let serviceTimezone: string | null = null;
export function setServiceTimezone(zone: string | null) {
  serviceTimezone = zone;
}
const localSchedule = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
export function formatServiceDateTime(value: string, options: Intl.DateTimeFormatOptions): string {
  if (localSchedule.test(value)) {
    const date = new Date(`${value}Z`);
    if (!Number.isFinite(date.getTime())) return '—';
    return `${new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date)} (${serviceTimezone ?? 'service local time'})`;
  }
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (!Number.isFinite(date.getTime())) return '—';
  const formatted = new Intl.DateTimeFormat('en-US', {
    ...options, timeZone: value.length === 10 ? 'UTC' : serviceTimezone ?? 'UTC',
  }).format(date);
  return value.length !== 10 && !serviceTimezone ? `${formatted} (UTC)` : formatted;
}
export function scheduleEpoch(value: string): number | null {
  if (!localSchedule.test(value)) {
    const epoch = Date.parse(value);
    return Number.isFinite(epoch) ? epoch : null;
  }
  if (!serviceTimezone) return null;
  const target = Date.parse(`${value}Z`);
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: serviceTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  let epoch = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(epoch)).map(p => [p.type, p.value]));
    const wall = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    const delta = target - wall;
    if (delta === 0) return epoch;
    epoch += delta;
  }
  return null;
}

/** A service calendar date, independent of the administrator's device timezone. */
export function serviceToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: serviceTimezone ?? 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
