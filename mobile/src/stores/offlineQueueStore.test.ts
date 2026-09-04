import { driverPortalApi } from '@api/driverPortalApi';
import { useOfflineQueue } from './offlineQueueStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@api/driverPortalApi', () => ({
  driverPortalApi: {
    getRide: jest.fn(),
    postRideAction: jest.fn(),
  },
}));

const mockedDriverPortalApi = jest.mocked(driverPortalApi);
const owner = { tenantId: 'tenant-a', userId: 7 };

describe('offline queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-04T12:00:00Z'));
    useOfflineQueue.setState({ queue: [], conflicts: [] });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defers a transient failure using exponential retry scheduling', async () => {
    useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
    mockedDriverPortalApi.getRide.mockRejectedValueOnce(new Error('Offline'));

    const result = await useOfflineQueue.getState().drain(owner);

    expect(result).toEqual({ success: 0, failed: 1, conflicts: 0 });
    expect(useOfflineQueue.getState().queue).toMatchObject([{
      retryCount: 1,
      nextRetryAt: '2026-09-04T12:01:00.000Z',
    }]);
  });

  it('treats queue entries stored before retry metadata as new failures', async () => {
    useOfflineQueue.setState({
      queue: [{
        id: 'legacy-action',
        rideId: 11,
        action: 'picked-up',
        queuedAt: '2026-09-04T11:00:00.000Z',
        tenantId: owner.tenantId,
        userId: owner.userId,
        expectedStatus: 'ARRIVED',
      }],
    });
    mockedDriverPortalApi.getRide.mockRejectedValueOnce(new Error('Offline'));

    await useOfflineQueue.getState().drain(owner);

    expect(useOfflineQueue.getState().queue).toMatchObject([{ retryCount: 1 }]);
  });

  it('uses the persisted idempotency key when a replay succeeds', async () => {
    const actionId = useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
    mockedDriverPortalApi.getRide.mockResolvedValueOnce({ status: 'ARRIVED' } as never);
    mockedDriverPortalApi.postRideAction.mockResolvedValueOnce({} as never);

    const result = await useOfflineQueue.getState().drain(owner);

    expect(result).toEqual({ success: 1, failed: 0, conflicts: 0 });
    expect(mockedDriverPortalApi.postRideAction).toHaveBeenCalledWith(11, 'picked-up', actionId);
    expect(useOfflineQueue.getState().queue).toEqual([]);
  });

  it('does not replay an action owned by a different session', async () => {
    useOfflineQueue.getState().enqueue(11, 'picked-up', { tenantId: 'tenant-b', userId: 8 }, 'ARRIVED');

    const result = await useOfflineQueue.getState().drain(owner);

    expect(result).toEqual({ success: 0, failed: 0, conflicts: 0 });
    expect(mockedDriverPortalApi.getRide).not.toHaveBeenCalled();
    expect(useOfflineQueue.getState().queue).toHaveLength(1);
  });

  it('drops an action after its third transient failure', async () => {
    useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
    mockedDriverPortalApi.getRide.mockRejectedValue(new Error('Offline'));

    await useOfflineQueue.getState().drain(owner);
    jest.setSystemTime(new Date('2026-09-04T12:01:00Z'));
    await useOfflineQueue.getState().drain(owner);
    jest.setSystemTime(new Date('2026-09-04T12:06:00Z'));
    const result = await useOfflineQueue.getState().drain(owner);

    expect(result).toEqual({ success: 0, failed: 1, conflicts: 0 });
    expect(useOfflineQueue.getState().queue).toEqual([]);
  });

  it('removes stale transition actions and reports a conflict', async () => {
    useOfflineQueue.getState().enqueue(11, 'picked-up', owner, 'ARRIVED');
    mockedDriverPortalApi.getRide.mockResolvedValueOnce({ status: 'DROPPED_OFF' } as never);

    const result = await useOfflineQueue.getState().drain(owner);

    expect(result).toEqual({ success: 0, failed: 0, conflicts: 1 });
    expect(mockedDriverPortalApi.postRideAction).not.toHaveBeenCalled();
    expect(useOfflineQueue.getState().queue).toEqual([]);
    expect(useOfflineQueue.getState().conflicts).toMatchObject([{
      id: expect.any(String),
      rideId: 11,
      expectedStatus: 'ARRIVED',
      currentStatus: 'DROPPED_OFF',
      tenantId: owner.tenantId,
      userId: owner.userId,
    }]);
  });
});