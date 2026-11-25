import { afterEach, it, expect } from "vitest";
import { formatServiceDateTime, scheduleEpoch, setServiceTimezone, serviceToday, addCalendarDays } from './serviceTime';

afterEach(() => setServiceTimezone(null));
it('keeps a provider-local schedule at its booked wall time and labels the zone', () => {
  setServiceTimezone('America/New_York');
  const result = formatServiceDateTime('2026-11-07T09:30:00', { hour: 'numeric', minute: '2-digit', hour12: true });
  expect(result).toContain('9:30');
  expect(result).toContain('America/New_York');
});
it('calculates an instant using the provider zone across DST changes', () => {
  setServiceTimezone('America/New_York');
  expect(scheduleEpoch('2026-11-07T09:30:00')).toBe(Date.parse('2026-11-07T14:30:00Z'));
  expect(scheduleEpoch('2026-07-07T09:30:00')).toBe(Date.parse('2026-07-07T13:30:00Z'));
});
it('does not invent the device timezone when the provider zone is unknown', () => {
  setServiceTimezone(null);
  expect(scheduleEpoch('2026-11-07T09:30:00')).toBeNull();
  expect(formatServiceDateTime('2026-11-07T09:30:00', { hour: 'numeric' })).toContain('service local time');
});
it('preserves date-only values and handles explicit instants', () => {
  setServiceTimezone('America/Los_Angeles');
  expect(formatServiceDateTime('2026-11-07', { day: 'numeric', month: 'short' })).toBe('Nov 7');
  expect(scheduleEpoch('2026-11-07T14:30:00Z')).toBe(Date.parse('2026-11-07T14:30:00Z'));
});

it('uses the tenant date around UTC midnight and preserves calendar arithmetic at month end', () => {
  setServiceTimezone('America/New_York');
  expect(serviceToday(new Date('2026-11-26T01:00:00Z'))).toBe('2026-11-25');
  setServiceTimezone('Pacific/Kiritimati');
  expect(serviceToday(new Date('2026-11-25T12:00:00Z'))).toBe('2026-11-26');
  expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
  expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
});
