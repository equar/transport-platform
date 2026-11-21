import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { billingApi, type InvoiceGenerationPayload, type PaymentPayload } from './billingApi';
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

describe('invoice generation retry identity', () => {
  const invoice = { billToType: 'RIDER', billToId: 1, rideIds: [5], invoiceDate: '2026-11-20', dueDate: '2026-12-20', currency: 'USD' } as InvoiceGenerationPayload;
  it('reuses the key after a lost response and clears it after success', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Response lost')).mockResolvedValue({ data: { data: { id: 5 } } });
    await expect(billingApi.generateInvoice(invoice)).rejects.toThrow('Response lost');
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem(sessionStorage.key(0)!)).not.toContain('RIDER');
    await billingApi.generateInvoice(invoice);
    const key = vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.['Idempotency-Key'];
    expect(key).toBeTruthy();
    expect(vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.['Idempotency-Key']).toBe(key);
    expect(sessionStorage.length).toBe(0);
  });
  it('uses a different identity when invoice details change', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Response lost'));
    await expect(billingApi.generateInvoice(invoice)).rejects.toThrow();
    await expect(billingApi.generateInvoice({ ...invoice, billToId: 2 })).rejects.toThrow();
    expect(vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.['Idempotency-Key'])
      .not.toBe(vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.['Idempotency-Key']);
  });
});
