import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';

interface QueuedAction {
  id: string;
  rideId: number;
  action: DriverRideAction;
  queuedAt: string;
  tenantId: string;
  userId: number;
  expectedStatus: string;
}

export interface QueueOwner { tenantId: string; userId: number }

interface OfflineQueueState {
  queue: QueuedAction[];
  enqueue: (rideId: number, action: DriverRideAction, owner: QueueOwner, expectedStatus: string) => void;
  drain: (owner: QueueOwner) => Promise<{ success: number; failed: number }>;
  clear: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      enqueue(rideId, action, owner, expectedStatus) {
        const item: QueuedAction = {
          id: `${rideId}-${action}-${Date.now()}`,
          rideId,
          action,
          queuedAt: new Date().toISOString(),
          tenantId: owner.tenantId,
          userId: owner.userId,
          expectedStatus,
        };
        set((s) => ({ queue: [...s.queue, item] }));
      },

      async drain(owner) {
        const { queue } = get();
        if (queue.length === 0) return { success: 0, failed: 0 };

        let success = 0;
        let failed = 0;
        const remaining: QueuedAction[] = [];

        for (const item of queue) {
          if (item.tenantId !== owner.tenantId || item.userId !== owner.userId) {
            remaining.push(item);
            continue;
          }
          try {
            const current = await driverPortalApi.getRide(item.rideId);
            if (current.status !== item.expectedStatus) {
              failed++;
              continue;
            }
            await driverPortalApi.postRideAction(item.rideId, item.action, item.id);
            success++;
          } catch {
            remaining.push(item);
            failed++;
          }
        }

        set({ queue: remaining });
        return { success, failed };
      },
      clear() { set({ queue: [] }); },
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
