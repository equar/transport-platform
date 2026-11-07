import { driverPortalApi } from '@api/driverPortalApi';
import { useOfflineQueue } from './offlineQueueStore';
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }));
jest.mock('@api/driverPortalApi', () => ({ driverPortalApi: { getRide: jest.fn(), postRideAction: jest.fn() } }));
const api = jest.mocked(driverPortalApi);
const owner = { tenantId: 'tenant-a', userId: 7 };
beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-04T12:00:00Z')); useOfflineQueue.getState().clear(); jest.resetAllMocks(); });
afterEach(() => jest.useRealTimers());
it('replays the original idempotency key without rejecting a previously committed transition', async () => {
  const id = useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
  api.postRideAction.mockResolvedValueOnce({ status: 'PICKED_UP' } as never);
  expect(await useOfflineQueue.getState().drain(owner)).toEqual({ success: 1, failed: 0, conflicts: 0 });
  expect(api.postRideAction).toHaveBeenCalledWith(11, 'picked-up', id, 'ARRIVED');
  expect(api.getRide).not.toHaveBeenCalled();
});
it('retains exhausted failures and supports a manual retry', async () => {
  const id = useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
  api.postRideAction.mockRejectedValue(new Error('Offline'));
  await useOfflineQueue.getState().drain(owner);
  expect(useOfflineQueue.getState().queue[0].nextRetryAt).toBe('2026-09-04T12:01:00.000Z');
  jest.advanceTimersByTime(60000); await useOfflineQueue.getState().drain(owner);
  jest.advanceTimersByTime(300000); await useOfflineQueue.getState().drain(owner);
  expect(useOfflineQueue.getState().queue).toMatchObject([{ id, failed: true, retryCount: 3 }]);
  useOfflineQueue.getState().retry(id);
  api.postRideAction.mockResolvedValue({} as never);
  await useOfflineQueue.getState().drain(owner);
  expect(useOfflineQueue.getState().queue).toEqual([]);
});
it('does not submit another account’s actions', async () => {
  useOfflineQueue.getState().enqueue(11, 'picked-up', { tenantId: 'b', userId: 8 }, 'ARRIVED');
  await useOfflineQueue.getState().drain(owner);
  expect(api.postRideAction).not.toHaveBeenCalled();
  expect(useOfflineQueue.getState().queue).toHaveLength(1);
});
it('preserves new actions enqueued during a drain and serializes concurrent drains', async () => {
  useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
  let finish!: (value: never) => void;
  api.postRideAction.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const first = useOfflineQueue.getState().drain(owner);
  const second = useOfflineQueue.getState().drain(owner);
  useOfflineQueue.getState().enqueue(12, 'arrived', owner, 'DRIVER_EN_ROUTE');
  finish({} as never);
  await Promise.all([first, second]);
  expect(api.postRideAction).toHaveBeenCalledTimes(1);
  expect(useOfflineQueue.getState().queue).toMatchObject([{ rideId: 12 }]);
});
it('cannot restore cleared entries when an old request fails after logout', async () => {
  useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
  let fail!: (error: Error) => void;
  api.postRideAction.mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; }));
  const draining = useOfflineQueue.getState().drain(owner);
  useOfflineQueue.getState().clear(); fail(new Error('Offline')); await draining;
  expect(useOfflineQueue.getState().queue).toEqual([]);
});
it('retains a server conflict with the latest trip status for review', async () => {
  useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
  api.postRideAction.mockRejectedValueOnce({ response: { status: 409 } });
  api.getRide.mockResolvedValueOnce({ status: 'DROPPED_OFF' } as never);
  expect(await useOfflineQueue.getState().drain(owner)).toEqual({ success: 0, failed: 0, conflicts: 1 });
  expect(useOfflineQueue.getState().conflicts).toMatchObject([{ currentStatus: 'DROPPED_OFF', ...owner }]);
});
