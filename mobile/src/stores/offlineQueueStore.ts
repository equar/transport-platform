import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';

interface QueuedAction {
  id: string;
  rideId: number;
  action: DriverRideAction;
  queuedAt: string;
}

interface OfflineQueueState {
  queue: QueuedAction[];
  enqueue: (rideId: number, action: DriverRideAction) => void;
  drain: () => Promise<{ success: number; failed: number }>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      enqueue(rideId, action) {
        const item: QueuedAction = {
          id: `${rideId}-${action}-${Date.now()}`,
          rideId,
          action,
          queuedAt: new Date().toISOString(),
        };
        set((s) => ({ queue: [...s.queue, item] }));
      },

      async drain() {
        const { queue } = get();
        if (queue.length === 0) return { success: 0, failed: 0 };

        let success = 0;
        let failed = 0;
        const remaining: QueuedAction[] = [];

        for (const item of queue) {
          try {
            await driverPortalApi.postRideAction(item.rideId, item.action);
            success++;
          } catch {
            remaining.push(item);
            failed++;
          }
        }

        set({ queue: remaining });
        return { success, failed };
      },
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
