import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { billingApi, type PaymentPayload } from './billingApi';
import { apiClient } from '../../../shared/api/client';
vi.mock('../../../shared/api/client', () => ({ apiClient: { post: vi.fn() }, unwrapResponse: (body: { data: unknown }) => body.data }));
const payload: PaymentPayload = { invoiceId: 1, paymentDate: '2026-11-13', amount: 25, paymentMethod: 'CASH', applyImmediately: true };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
describe('financial retry identity', () => {
  it('keeps the same intent key after an uncertain result and starts a new intent after success', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Response lost')).mockResolvedValue({ data: { data: { id: 4 } } });
    await expect(billingApi.createPayment(payload)).rejects.toThrow('Response lost');
    await billingApi.createPayment(payload);
    const first = vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.['Idempotency-Key'];
    expect(first).toBeTruthy();
    expect(vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.['Idempotency-Key']).toBe(first);
    await billingApi.createPayment(payload);
    expect(vi.mocked(apiClient.post).mock.calls[2][2]?.headers?.['Idempotency-Key']).not.toBe(first);
    expect(sessionStorage.length).toBe(0);
  });
});
