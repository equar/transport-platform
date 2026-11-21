import { riderPortalApi } from './riderPortalApi';
import type { PageResponse } from './types';
import type { RiderPortalRideRecord } from './riderPortalApi';

// Query each active status directly so old or delayed trips cannot be hidden
// behind a date filter or the first page of completed trips.
export async function guardianActiveRidesPage(page: number): Promise<PageResponse<RiderPortalRideRecord>> {
  const results = await Promise.all(['DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'].map(status =>
    riderPortalApi.searchRides({ status, page, size: 20, sortBy: 'scheduledPickupAt', sortDirection: 'ASC' }),
  ));
  return {
    items: results.flatMap(result => result.items),
    totalElements: results.reduce((sum, result) => sum + result.totalElements, 0),
    totalPages: Math.max(...results.map(result => result.totalPages)),
    page,
    size: 60,
  };
}
