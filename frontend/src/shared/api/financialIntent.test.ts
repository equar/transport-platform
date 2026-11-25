import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { postFinancialAdjustment } from "./financialIntent";
import { apiClient } from "./client";
const account = vi.hoisted(() => ({
  user: 1,
  tenant: "tenant-a",
  generation: 1,
}));
vi.mock("./client", () => ({
  apiClient: { post: vi.fn() },
  unwrapResponse: (body: { data: unknown }) => body.data,
  captureAuthenticatedRequestScope: () => ({
    key: JSON.stringify([account.tenant, account.user]),
    config: { _sessionGeneration: account.generation },
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  account.user++;
  account.generation++;
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => vi.unstubAllGlobals());
it("preserves an uncertain refund intent across account switches without storing refund details", async () => {
  const path = "/company/payments/1/refunds",
    payload = { amount: 10, reason: "Returned cash", reference: "BANK-123" };
  vi.mocked(apiClient.post)
    .mockRejectedValueOnce(new Error("Lost response"))
    .mockResolvedValue({ data: { data: { id: 1 } } });
  await expect(postFinancialAdjustment(path, payload)).rejects.toThrow(
    "Lost response",
  );
  const first = vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.[
    "Idempotency-Key"
  ];
  expect(sessionStorage.key(0)).not.toContain(payload.reason);
  const original = account.user;
  account.user++;
  account.generation++;
  await postFinancialAdjustment(path, payload);
  expect(
    vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.["Idempotency-Key"],
  ).not.toBe(first);
  account.user = original;
  account.generation++;
  await postFinancialAdjustment(path, payload);
  expect(
    vi.mocked(apiClient.post).mock.calls[2][2]?.headers?.["Idempotency-Key"],
  ).toBe(first);
  expect(sessionStorage.length).toBe(0);
});

it("keeps a confirmed financial operation separate from a subsequent intentional operation", async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: 1 } } });
  await postFinancialAdjustment('/company/driver-payouts', { amount: 10, reference: 'A' });
  await postFinancialAdjustment('/company/driver-payouts', { amount: 10, reference: 'A' });
  expect(vi.mocked(apiClient.post).mock.calls[0][2]?.headers?.['Idempotency-Key'])
    .not.toBe(vi.mocked(apiClient.post).mock.calls[1][2]?.headers?.['Idempotency-Key']);
});
