import { postFinancialIntent } from "../../../shared/api/financialRequests";
import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";
export interface BillingAccount {
  subscriptionId: number;
  tenantId: string;
  tenantName: string;
  planCode: string;
  subscriptionStatus: string;
  enabled: boolean;
  monthlyDriverRate: number | null;
  currency: "USD";
  firstRenewalDate: string | null;
  nextRenewalDate: string | null;
  nextRenewalAt: string | null;
  paymentDueDays: number;
  collectionMode: "MANUAL" | "AUTOMATIC";
  automaticAvailable: boolean;
  activeDrivers: number;
  pendingRateDate: string | null;
  pendingRate: number | null;
}
export interface SubscriptionInvoice {
  id: number;
  subscriptionId: number;
  tenantId: string;
  tenantName: string;
  planCode: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  meteredAt: string;
  driverCount: number;
  driverIdsJson: string;
  monthlyDriverRate: number;
  currency: "USD";
  amount: number;
  paidAmount: number;
  creditedAmount?: number;
  originalAmount?: number;
  collectionMode: string;
  collectionState: string;
  status: string;
  createdAt: string;
}
export interface BillingPayment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentReference: string;
  source: string;
  recordedBy: string;
  recordedAt: string;
}
export interface SubscriptionAdjustment { id: number; paymentId: number | null; kind: string; amount: number; reference: string; reason: string; createdAt: string }
export interface SubscriptionAdjustmentRequest { kind: string; paymentId: number | null; amount: number; reference: string; reason: string }
export interface BillingConfiguration {
  monthlyDriverRate: number;
  firstRenewalDate: string;
  paymentDueDays: number;
  collectionMode: "MANUAL" | "AUTOMATIC";
  enabled: boolean;
}
export const subscriptionBillingApi = {
  async accounts(platform: boolean, page: number, size: number) {
    const r = await apiClient.get(
      `/${platform ? "platform" : "company"}/subscription-billing/accounts`,
      { params: { page, size } },
    );
    return unwrapResponse<PageResponse<BillingAccount>>(r.data);
  },
  async invoices(
    platform: boolean,
    page: number,
    size: number,
    subscriptionId?: number,
  ) {
    const r = await apiClient.get(
      `/${platform ? "platform" : "company"}/subscription-billing/invoices`,
      { params: { page, size, subscriptionId } },
    );
    return unwrapResponse<PageResponse<SubscriptionInvoice>>(r.data);
  },
  async detail(platform: boolean, id: number) {
    const r = await apiClient.get(
      `/${platform ? "platform" : "company"}/subscription-billing/invoices/${id}`,
    );
    return unwrapResponse<{
      invoice: SubscriptionInvoice;
      payments: BillingPayment[];
      adjustments?: SubscriptionAdjustment[];
    }>(r.data);
  },
  async configure(id: number, payload: BillingConfiguration) {
    const r = await apiClient.put(
      `/platform/subscription-billing/accounts/${id}`,
      payload,
    );
    return unwrapResponse<BillingAccount>(r.data);
  },
  async generate(id: number) {
    const r = await apiClient.post(
      `/platform/subscription-billing/accounts/${id}/generate`,
    );
    return unwrapResponse<SubscriptionInvoice | null>(r.data);
  },
  async reconcile(id: number) {
    const response = await apiClient.post(`/platform/subscription-billing/invoices/${id}/reconcile`);
    return unwrapResponse<SubscriptionInvoice>(response.data);
  },
  async adjust(id: number, payload: SubscriptionAdjustmentRequest) {
    return postFinancialIntent(`/platform/subscription-billing/invoices/${id}/adjustments`, payload);
  },
  async payment(id: number, amount: number, reference: string) {
    const r = await apiClient.post(
      `/platform/subscription-billing/invoices/${id}/payments`,
      { amount, reference },
    );
    return unwrapResponse<SubscriptionInvoice>(r.data);
  },
};
