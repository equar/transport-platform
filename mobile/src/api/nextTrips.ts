import type { PageResponse } from './types';

/** Ask for each relevant status before selecting; completed history cannot hide live work. */
export async function nextTripsPage<T extends { id: number; status: string; scheduledPickupAt: string }>(
  search: (filters: { status: string; page: number; size: number; sortBy: string; sortDirection: string }) => Promise<PageResponse<T>>,
  statuses: readonly string[],
): Promise<PageResponse<T>> {
  const pages = await Promise.all([...new Set(statuses)].map(status => search({ status, page: 0, size: 3, sortBy: 'scheduledPickupAt', sortDirection: 'ASC' })));
  const items = [...new Map(pages.flatMap(p => p.items).map(trip => [trip.id, trip])).values()]
    .sort((a, b) => a.scheduledPickupAt.localeCompare(b.scheduledPickupAt));
  return { items, page: 0, size: items.length, totalElements: pages.reduce((n, p) => n + p.totalElements, 0), totalPages: 1 };
}
export const passengerNextStatuses = ['DROPPED_OFF', 'SCHEDULED', 'ASSIGNED', 'REQUESTED', 'PENDING_REVIEW'] as const;
export const driverNextStatuses = ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP', 'DROPPED_OFF'] as const;
