import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { billingApi, type InvoiceGenerationPayload, type PaymentPayload } from './billingApi';
import { apiClient } from '../../../shared/api/client';
const account = vi.hoisted(() => ({ tenant: 'tenant-a', user: 0, generation: 0 }));
vi.mock('../../../shared/api/client', () => ({
  apiClient: { post: vi.fn() },
  unwrapResponse: (body: { data: unknown }) => body.data,
  captureTenantRequestScope: () => ({ key: JSON.stringify([account.tenant, account.user]), config: { _sessionGeneration: account.generation } }),
}));
const payload: PaymentPayload = { invoiceId: 1, paymentDate: '2026-11-13', amount: 25, paymentMethod: 'CASH', applyImmediately: true };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); account.tenant = "tenant-a"; account.user++; account.generation++; vi.stubGlobal('crypto', webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
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

describe.each(['invoice', 'payment'] as const)('%s retry account isolation', kind => {
  const invoice = { billToType: 'RIDER', billToId: 1, rideIds: [], taxAmount: 0, discountAmount: 0, manualLineItems: [{ description: 'Service', chargeSourceType: 'MANUAL', quantity: 1, unitPrice: 10 }], invoiceDate: '2026-11-20', dueDate: '2026-12-20', currency: 'USD' } as InvoiceGenerationPayload;
  const submit = () => kind === 'invoice' ? billingApi.generateInvoice(invoice) : billingApi.createPayment(payload);
  it('does not let a late successful replay clear a newer pending intent', async () => {
    type Reply = Awaited<ReturnType<typeof apiClient.post>>;
    let finishFirst!: (value: Reply) => void, finishSecond!: (value: Reply) => void;
    let loseThird!: (error: Error) => void;
    const reply = { data: { data: { id: 5 } } } as Reply;
    vi.mocked(apiClient.post)
      .mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { finishSecond = resolve; }))
      .mockImplementationOnce(() => new Promise((_, reject) => { loseThird = reject; }))
      .mockResolvedValue(reply);
    const first = submit();
    await vi.waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    const second = submit();
    await vi.waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
    finishFirst(reply); await first;
    const third = submit();
    const lost = expect(third).rejects.toThrow('Response lost');
    await vi.waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(3));
    const newerKey = vi.mocked(apiClient.post).mock.calls[2][2]?.headers?.['Idempotency-Key'];
    finishSecond(reply); await second;
    loseThird(new Error('Response lost')); await lost;
    await submit();
    expect(vi.mocked(apiClient.post).mock.calls[3][2]?.headers?.['Idempotency-Key']).toBe(newerKey);
  });
  it.each(['user', 'tenant', 'memory'] as const)('preserves account A pending identity across a %s switch', async dimension => {
    if (dimension === 'memory') vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    const original = { ...account };
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Response lost')).mockResolvedValue({ data: { data: { id: 5 } } });
    await expect(submit()).rejects.toThrow('Response lost');
    const first = vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.['Idempotency-Key'];
    if (dimension === 'tenant') account.tenant = 'tenant-b'; else account.user += 1000;
    account.generation++;
    await submit();
    expect(vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.['Idempotency-Key']).not.toBe(first);
    Object.assign(account, original, { generation: account.generation + 1 });
    await submit();
    expect(vi.mocked(apiClient.post).mock.calls[2][2]?.headers?.['Idempotency-Key']).toBe(first);
    vi.restoreAllMocks();
  });
});
