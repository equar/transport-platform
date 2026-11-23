import { nextTripsPage, passengerNextStatuses } from './nextTrips';
it('requests nonterminal statuses directly and keeps old pending confirmation ahead of completed history', async () => {
  const search = jest.fn(async ({ status }: { status: string }) => ({ items: status === 'DROPPED_OFF' ? [{ id: 1, status, scheduledPickupAt: '2026-10-01T10:00:00' }] : status === 'ASSIGNED' ? [{ id: 2, status, scheduledPickupAt: '2026-11-25T10:00:00' }] : [], page: 0, size: 3, totalPages: 1, totalElements: 1 }));
  const result = await nextTripsPage(search, [...passengerNextStatuses, passengerNextStatuses[0]]);
  expect(result.items.map(trip => trip.id)).toEqual([1, 2]);
  expect(search).toHaveBeenCalledTimes(passengerNextStatuses.length);
  expect(search).toHaveBeenCalledWith(expect.objectContaining({ status: 'DROPPED_OFF' }));
  for (const [filters] of search.mock.calls) expect(filters.status).not.toBe('COMPLETED');
});
