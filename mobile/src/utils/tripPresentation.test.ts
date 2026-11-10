import { isFinishedTrip, isTrackableTrip, tripStatusLabel } from './tripPresentation';
describe('Trip presentation', () => {
  it('keeps active delayed trips out of history and finished trips out of upcoming', () => {
    for (const state of ['REQUESTED','SCHEDULED','ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','PICKED_UP']) expect(isFinishedTrip(state)).toBe(false);
    for (const state of ['DROPPED_OFF','COMPLETED','CANCELLED','MISSED','FAILED','RIDER_NO_SHOW']) expect(isFinishedTrip(state)).toBe(true);
  });
  it('uses passenger-friendly status labels without enum formatting', () => {
    expect(tripStatusLabel('DRIVER_EN_ROUTE')).toBe('Driver on the way');
    expect(tripStatusLabel('PICKED_UP')).toBe('On board');
    expect(tripStatusLabel('PENDING_REVIEW')).toBe('Under review');
  });
});

it('limits live sharing to travel before passenger drop-off', () => {
  for (const status of ['DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP']) expect(isTrackableTrip(status)).toBe(true);
  for (const status of ['ASSIGNED', 'DROPPED_OFF', 'COMPLETED', 'CANCELLED', 'FAILED']) expect(isTrackableTrip(status)).toBe(false);
});
