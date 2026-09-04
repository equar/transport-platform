import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';
import { createIdempotencyKey } from '@utils/idempotencyKey';

interface QueuedAction {
  id: string;
  rideId: number;
  action: DriverRideAction;
  queuedAt: string;
  retryCount?: number;
  nextRetryAt?: string | null;
  tenantId: string;
  userId: number;
  expectedStatus: string;
}

export interface QueueOwner { tenantId: string; userId: number }

interface QueuedActionConflict {
  id: string;
  rideId: number;
  action: DriverRideAction;
  expectedStatus: string;
  currentStatus: string;
  detectedAt: string;
  tenantId: string;
  userId: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000];

function nextRetryAt(retryCount: number, now: number): string | null {
  const delay = RETRY_DELAYS_MS[retryCount - 1];
  return delay ? new Date(now + delay).toISOString() : null;
}

interface OfflineQueueState {
  queue: QueuedAction[];
  conflicts: QueuedActionConflict[];
  enqueue: (rideId: number, action: DriverRideAction, owner: QueueOwner, expectedStatus: string) => string;
  drain: (owner: QueueOwner) => Promise<{ success: number; failed: number; conflicts: number }>;
  dismissConflict: (id: string) => void;
  clear: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      conflicts: [],

      enqueue(rideId, action, owner, expectedStatus) {
        const duplicate = get().queue.find((queuedAction) =>
          queuedAction.rideId === rideId
          && queuedAction.action === action
          && queuedAction.tenantId === owner.tenantId
          && queuedAction.userId === owner.userId
          && queuedAction.expectedStatus === expectedStatus,
        );
        if (duplicate) {
          return duplicate.id;
        }

        const item: QueuedAction = {
          id: createIdempotencyKey('driver-action'),
          rideId,
          action,
          queuedAt: new Date().toISOString(),
          retryCount: 0,
          nextRetryAt: null,
          tenantId: owner.tenantId,
          userId: owner.userId,
          expectedStatus,
        };
        set((s) => ({ queue: [...s.queue, item] }));
        return item.id;
      },

      async drain(owner) {
        const { queue } = get();
        if (queue.length === 0) return { success: 0, failed: 0, conflicts: 0 };

        let success = 0;
        let failed = 0;
        let conflicts = 0;
        const remaining: QueuedAction[] = [];
        const now = Date.now();

        for (const item of queue) {
          if (item.tenantId !== owner.tenantId || item.userId !== owner.userId) {
            remaining.push(item);
            continue;
          }
          if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) {
            remaining.push(item);
            continue;
          }
          try {
            const current = await driverPortalApi.getRide(item.rideId);
            if (current.status !== item.expectedStatus) {
              conflicts++;
              set((state) => ({
                conflicts: [...state.conflicts, {
                  id: item.id,
                  rideId: item.rideId,
                  action: item.action,
                  expectedStatus: item.expectedStatus,
                  currentStatus: current.status,
                  detectedAt: new Date(now).toISOString(),
                  tenantId: item.tenantId,
                  userId: item.userId,
                }],
              }));
              continue;
            }
            await driverPortalApi.postRideAction(item.rideId, item.action, item.id);
            success++;
          } catch {
            failed++;
            const retryCount = (item.retryCount ?? 0) + 1;
            if (retryCount < MAX_RETRY_ATTEMPTS) {
              remaining.push({ ...item, retryCount, nextRetryAt: nextRetryAt(retryCount, now) });
            }
          }
        }

        set({ queue: remaining });
        return { success, failed, conflicts };
      },
      dismissConflict(id) {
        set((state) => ({ conflicts: state.conflicts.filter((conflict) => conflict.id !== id) }));
      },
      clear() { set({ queue: [], conflicts: [] }); },
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
