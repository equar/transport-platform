import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverPortalApi, type DriverRideAction } from '@api/driverPortalApi';
import { createIdempotencyKey } from '@utils/idempotencyKey';

export interface QueueOwner { tenantId: string; userId: number }
interface QueuedAction extends QueueOwner {
  id: string; rideId: number; action: DriverRideAction; queuedAt: string;
  expectedStatus: string; retryCount?: number; nextRetryAt?: string | null;
  failed?: boolean; error?: string;
}
interface QueuedActionConflict extends QueueOwner {
  id: string; rideId: number; action: DriverRideAction; expectedStatus: string;
  currentStatus: string; detectedAt: string;
}
interface DrainResult { success: number; failed: number; conflicts: number }
interface OfflineQueueState {
  queue: QueuedAction[]; conflicts: QueuedActionConflict[];
  enqueue: (rideId: number, action: DriverRideAction, owner: QueueOwner, expectedStatus: string) => string;
  drain: (owner: QueueOwner) => Promise<DrainResult>;
  retry: (id: string) => void;
  dismissConflict: (id: string) => void;
  retainOwner: (owner: QueueOwner) => void;
  pause: () => void;
  clear: () => void;
}
let draining: Promise<DrainResult> | null = null;
let generation = 0;
const owns = (item: QueueOwner, owner: QueueOwner) => item.tenantId === owner.tenantId && item.userId === owner.userId;

export const useOfflineQueue = create<OfflineQueueState>()(persist((set, get) => ({
  queue: [], conflicts: [],
  enqueue(rideId, action, owner, expectedStatus) {
    const duplicate = get().queue.find(item => item.rideId === rideId && owns(item, owner)
      && item.action === action && item.expectedStatus === expectedStatus);
    if (duplicate) return duplicate.id;
    const id = createIdempotencyKey('driver-action');
    set(state => ({ queue: [...state.queue, { id, rideId, action, ...owner, expectedStatus,
      queuedAt: new Date().toISOString(), retryCount: 0 }] }));
    return id;
  },
  drain(owner) {
    if (draining) return draining;
    const epoch = generation;
    draining = (async () => {
      const result = { success: 0, failed: 0, conflicts: 0 };
      for (const item of get().queue) {
        if (epoch !== generation) break;
        if (!owns(item, owner) || item.failed || (item.nextRetryAt && Date.parse(item.nextRetryAt) > Date.now())) continue;
        try {
          // Replay first: the server resolves a committed idempotency key before checking the transition.
          await driverPortalApi.postRideAction(item.rideId, item.action, item.id, item.expectedStatus);
          if (epoch !== generation) break;
          result.success++;
          set(state => ({ queue: state.queue.filter(entry => entry.id !== item.id) }));
        } catch (error) {
          if (epoch !== generation) break;
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status === 409) {
            let currentStatus = 'CHANGED';
            try { currentStatus = (await driverPortalApi.getRide(item.rideId)).status; } catch { /* retain actionable conflict */ }
            if (epoch !== generation) break;
            result.conflicts++;
            set(state => ({ queue: state.queue.filter(entry => entry.id !== item.id),
              conflicts: [...state.conflicts.filter(entry => entry.id !== item.id), { ...item, currentStatus, detectedAt: new Date().toISOString() }] }));
          } else {
            result.failed++;
            const retryCount = (item.retryCount ?? 0) + 1;
            const failed = retryCount >= 3 || (status != null && status >= 400 && status < 500 && ![408, 429].includes(status));
            set(state => ({ queue: state.queue.map(entry => entry.id === item.id ? { ...entry, retryCount, failed,
              error: failed ? 'Action needs attention. Check the trip, then retry or contact dispatch.' : 'Waiting to retry connection.',
              nextRetryAt: failed ? null : new Date(Date.now() + (retryCount === 1 ? 60_000 : 300_000)).toISOString() } : entry) }));
          }
        }
      }
      return result;
    })().finally(() => { draining = null; });
    return draining;
  },
  retry(id) { set(state => ({ queue: state.queue.map(item => item.id === id ? { ...item, failed: false, retryCount: 0, nextRetryAt: null, error: undefined } : item) })); },
  dismissConflict(id) { set(state => ({ conflicts: state.conflicts.filter(item => item.id !== id) })); },
  retainOwner(owner) { generation++; set(state => ({ queue: state.queue.filter(item => owns(item, owner)), conflicts: state.conflicts.filter(item => owns(item, owner)) })); },
  pause() { generation++; },
  clear() { generation++; set({ queue: [], conflicts: [] }); },
}), { name: 'offline-queue', storage: createJSONStorage(() => AsyncStorage) }));
