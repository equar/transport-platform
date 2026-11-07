import { apiClient, unwrapResponse } from './client';

export interface PushTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export const pushNotificationsApi = {
  async register(payload: PushTokenPayload) {
    const response = await apiClient.put('/portal/push-token', payload);
    return unwrapResponse<string>(response.data);
  },
  async unregister(token: string) {
    const response = await apiClient.post('/portal/push-token/unregister', { token });
    return unwrapResponse<string>(response.data);
  },
};
