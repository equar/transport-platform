import { apiClient, unwrapResponse } from './client';
import type { PageResponse } from './types';

export interface NotificationRecord {
  id: number;
  notificationType: string;
  channel: string;
  subject: string | null;
  summary: string;
  readStatus: 'READ' | 'UNREAD';
  sentAt: string;
}

export const notificationsApi = {
  async getLatest(limit = 20) {
    const r = await apiClient.get('/notifications/latest', { params: { limit } });
    return unwrapResponse<NotificationRecord[]>(r.data);
  },
  async getUnreadCount() {
    const r = await apiClient.get('/notifications/unread-count');
    return unwrapResponse<number>(r.data);
  },
  async search(params?: Record<string, unknown>) {
    const r = await apiClient.get('/notifications', { params });
    return unwrapResponse<PageResponse<NotificationRecord>>(r.data);
  },
  async markRead(id: number) {
    const r = await apiClient.post(`/notifications/${id}/read`);
    return unwrapResponse<void>(r.data);
  },
  async markAllRead() {
    const r = await apiClient.post('/notifications/read-all');
    return unwrapResponse<void>(r.data);
  },
};
