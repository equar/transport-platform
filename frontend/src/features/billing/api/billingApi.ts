import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";
import type { RideTripType, ServiceType } from "../../rides/api/ridesApi";

export const pricingModelOptions = [
  "FLAT_RATE",
  "PER_TRIP",
  "PER_WEEK",
  "PER_MONTH",
  "PER_ROUTE",
  "PER_RIDER",
  "CUSTOM",
] as const;

export const billToTypeOptions = [
  "RIDER",
  "GUARDIAN",
  "ORGANIZATION",
  "CONTRACT",
] as const;

export const pricingRuleStatusOptions = [
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "EXPIRED",
] as const;

export const invoiceStatusOptions = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
] as const;

export const chargeSourceTypeOptions = [
  "RIDE",
  "ROUTE",
  "CONTRACT",
  "MANUAL",
  "RECURRING_SERVICE",
  "OTHER",
] as const;

export const paymentMethodOptions = [
  "CASH",
  "CHECK",
  "BANK_TRANSFER",
  "ACH",
  "CARD",
  "ZELLE",
  "CASH_APP",
  "VENMO",
  "OTHER",
] as const;

export const paymentStatusOptions = [
  "RECORDED",
  "APPLIED",
  "PARTIALLY_APPLIED",
  "VOID",
  "FAILED",
] as const;

export const collectionContactMethodOptions = [
  "EMAIL",
  "PHONE",
  "SMS",
  "REMINDER_NOTE",
  "OTHER",
] as const;

export const invoiceAgingBucketOptions = [
  "CURRENT",
  "DAYS_1_TO_30",
  "DAYS_31_TO_60",
  "DAYS_61_TO_90",
  "DAYS_90_PLUS",
] as const;

export const riderTypeOptions = [
  "STUDENT",
  "ELDERLY",
  "NEMT",
  "PRIVATE_PAY",
  "EMPLOYEE_COMMUTER",
  "OTHER",
] as const;

export const organizationTypeOptions = [
  "SCHOOL",
  "CLINIC",
  "HOSPITAL",
  "DIALYSIS_CENTER",
  "ADULT_DAY_CARE_CENTER",
  "CHURCH",
  "EMPLOYER",
  "COMMUNITY_ORGANIZATION",
  "OTHER",
] as const;

export const contractTypeOptions = [
  "SCHOOL_ROUTE",
  "NEMT_SERVICE",
  "PRIVATE_ORGANIZATION",
  "EMPLOYER_COMMUTER",
  "AD_HOC",
  "OTHER",
] as const;

export type PricingModel = (typeof pricingModelOptions)[number];
export type BillToType = (typeof billToTypeOptions)[number];
export type PricingRuleStatus = (typeof pricingRuleStatusOptions)[number];
export type InvoiceStatus = (typeof invoiceStatusOptions)[number];
export type ChargeSourceType = (typeof chargeSourceTypeOptions)[number];
export type RiderType = (typeof riderTypeOptions)[number];
export type OrganizationType = (typeof organizationTypeOptions)[number];
export type ContractType = (typeof contractTypeOptions)[number];
export type PaymentMethod = (typeof paymentMethodOptions)[number];
export type PaymentStatus = (typeof paymentStatusOptions)[number];
export type CollectionContactMethod =
  (typeof collectionContactMethodOptions)[number];
export type InvoiceAgingBucket = (typeof invoiceAgingBucketOptions)[number];

export interface PricingRuleSummaryRecord {
  id: number;
  tenantId: string;
  pricingRuleCode: string;
  name: string;
  pricingModel: PricingModel;
  billToType: BillToType;
  serviceType: ServiceType | null;
  amount: number;
  currency: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  priorityOrder: number;
  status: PricingRuleStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PricingRuleRecord extends PricingRuleSummaryRecord {
  description: string | null;
  riderType: RiderType | null;
  organizationType: OrganizationType | null;
  contractType: ContractType | null;
  tripType: RideTripType | null;
  notes: string | null;
}

export interface PricingRulePayload {
  name: string;
  description?: string | null;
  pricingModel: PricingModel;
  billToType: BillToType;
  serviceType?: ServiceType | null;
  riderType?: RiderType | null;
  organizationType?: OrganizationType | null;
  contractType?: ContractType | null;
  tripType?: RideTripType | null;
  amount: number;
  currency: string;
  effectiveStartDate: string;
  effectiveEndDate?: string | null;
  priorityOrder: number;
  notes?: string | null;
}

export interface InvoiceLineItemRecord {
  id: number;
  invoiceId: number;
  lineNumber: number;
  description: string;
  chargeSourceType: ChargeSourceType;
  sourceReferenceId: number | null;
  pricingRuleId: number | null;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  serviceDate: string | null;
  servicePeriodLabel: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface InvoiceSummaryRecord {
  id: number;
  tenantId: string;
  invoiceNumber: string;
  billToType: BillToType;
  billToId: number;
  billToNameSnapshot: string;
  contractId: number | null;
  organizationId: number | null;
  riderId: number | null;
  guardianId: number | null;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  notes: string | null;
  status: InvoiceStatus;
  daysPastDue: number | null;
  agingBucket: InvoiceAgingBucket | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PaymentSummaryRecord {
  id: number;
  tenantId: string;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  billToNameSnapshot: string;
  invoiceStatus: InvoiceStatus;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  payerName: string | null;
  payerContact: string | null;
  status: PaymentStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PaymentRecord extends PaymentSummaryRecord {
  invoiceTotalAmount: number;
  invoiceAmountPaid: number;
  invoiceBalanceDue: number;
  externalTransactionId: string | null;
  notes: string | null;
  voidReason: string | null;
}

export interface CollectionNoteRecord {
  id: number;
  invoiceId: number;
  contactMethod: CollectionContactMethod;
  note: string;
  nextFollowUpDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AgingBucketSummaryRecord {
  bucket: InvoiceAgingBucket;
  invoiceCount: number;
  amount: number;
}

export interface ReceivablesSummaryRecord {
  totalPaymentsRecorded: number;
  totalCollectedAmount: number;
  outstandingBalance: number;
  overdueInvoiceCount: number;
  overdueAmount: number;
  partiallyPaidInvoiceCount: number;
  agingBuckets: AgingBucketSummaryRecord[];
}

export interface InvoiceRecord extends InvoiceSummaryRecord {
  voidReason: string | null;
  lineItems: InvoiceLineItemRecord[];
  payments: PaymentSummaryRecord[];
  collectionNotes: CollectionNoteRecord[];
}

export interface InvoicePayload {
  billToType: BillToType;
  billToId: number | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  invoiceDate: string;
  dueDate: string;
  taxAmount: number;
  discountAmount: number;
  currency: string;
  notes?: string | null;
}

export interface InvoiceLineItemPayload {
  description: string;
  chargeSourceType: ChargeSourceType;
  sourceReferenceId?: number | null;
  pricingRuleId?: number | null;
  quantity: number;
  unitPrice: number;
  serviceDate?: string | null;
  servicePeriodLabel?: string | null;
  notes?: string | null;
}

export interface PaymentPayload {
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  payerName?: string | null;
  payerContact?: string | null;
  externalTransactionId?: string | null;
  notes?: string | null;
  applyImmediately?: boolean | null;
}

export interface PaymentPreviewPayload {
  invoiceId: number;
  amount: number;
}

export interface PaymentPreviewRecord {
  invoiceId: number;
  invoiceNumber: string;
  billToNameSnapshot: string;
  currentBalanceDue: number;
  paymentAmount: number;
  resultingBalanceDue: number;
  resultingInvoiceStatus: InvoiceStatus;
}

export interface CollectionNotePayload {
  contactMethod: CollectionContactMethod;
  note: string;
  nextFollowUpDate?: string | null;
}

export interface BillingPreviewPayload {
  billToType: BillToType;
  billToId: number | null;
  pricingRuleId?: number | null;
  routeId?: number | null;
  rideIds: number[];
  serviceType?: ServiceType | null;
  tripType?: RideTripType | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  quantity?: number | null;
  tripCount?: number | null;
  riderCount?: number | null;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  manualOverrideAmount?: number | null;
  manualOverrideNote?: string | null;
  notes?: string | null;
  manualLineItems: InvoiceLineItemPayload[];
}

export interface InvoiceGenerationPayload extends BillingPreviewPayload {
  invoiceDate: string;
  dueDate: string;
}

export interface BillingPreviewRecord {
  billToType: BillToType;
  billToId: number;
  billToName: string;
  pricingRuleId: number | null;
  pricingRuleCode: string | null;
  pricingRuleName: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  manualOverrideApplied: boolean;
  manualOverrideNote: string | null;
  lineItems: InvoiceLineItemRecord[];
}

export interface LookupOption {
  id: number;
  label: string;
  secondaryLabel?: string;
}

function compactParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (typeof value === "string") {
        return true;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    }),
  );
}

export const billingApi = {
  async searchPricingRules(params: {
    keyword: string;
    status: PricingRuleStatus | "";
    pricingModel: PricingModel | "";
    billToType: BillToType | "";
    serviceType: ServiceType | "";
    effectiveFrom: string;
    effectiveTo: string;
    page: number;
    size: number;
    sortBy: string;
    sortDirection: "ASC" | "DESC";
  }) {
    const response = await apiClient.get("/company/pricing-rules", {
      params: compactParams({
        keyword: params.keyword,
        status: params.status || undefined,
        pricingModel: params.pricingModel || undefined,
        billToType: params.billToType || undefined,
        serviceType: params.serviceType || undefined,
        effectiveFrom: params.effectiveFrom || undefined,
        effectiveTo: params.effectiveTo || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      }),
    });
    return unwrapResponse<PageResponse<PricingRuleSummaryRecord>>(response.data);
  },
  async getPricingRule(id: number) {
    const response = await apiClient.get(`/company/pricing-rules/${id}`);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async createPricingRule(payload: PricingRulePayload) {
    const response = await apiClient.post("/company/pricing-rules", payload);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async updatePricingRule(id: number, payload: PricingRulePayload) {
    const response = await apiClient.put(`/company/pricing-rules/${id}`, payload);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async activatePricingRule(id: number) {
    const response = await apiClient.post(`/company/pricing-rules/${id}/activate`);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async suspendPricingRule(id: number) {
    const response = await apiClient.post(`/company/pricing-rules/${id}/suspend`);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async deactivatePricingRule(id: number) {
    const response = await apiClient.post(`/company/pricing-rules/${id}/deactivate`);
    return unwrapResponse<PricingRuleRecord>(response.data);
  },
  async searchInvoices(params: {
    keyword: string;
    status: InvoiceStatus | "";
    agingBucket?: InvoiceAgingBucket | "";
    billToType: BillToType | "";
    fromDate: string;
    toDate: string;
    overdueOnly: boolean;
    page: number;
    size: number;
    sortBy: string;
    sortDirection: "ASC" | "DESC";
  }) {
    const response = await apiClient.get("/company/invoices", {
      params: compactParams({
        keyword: params.keyword,
        status: params.status || undefined,
        agingBucket: params.agingBucket || undefined,
        billToType: params.billToType || undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        overdueOnly: params.overdueOnly || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      }),
    });
    return unwrapResponse<PageResponse<InvoiceSummaryRecord>>(response.data);
  },
  async getInvoice(id: number) {
    const response = await apiClient.get(`/company/invoices/${id}`);
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async createInvoice(payload: InvoicePayload) {
    const response = await apiClient.post("/company/invoices", payload);
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async updateInvoice(id: number, payload: InvoicePayload) {
    const response = await apiClient.put(`/company/invoices/${id}`, payload);
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async issueInvoice(id: number) {
    const response = await apiClient.post(`/company/invoices/${id}/issue`);
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async voidInvoice(id: number, reason: string) {
    const response = await apiClient.post(`/company/invoices/${id}/void`, {
      reason,
    });
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async addLineItem(invoiceId: number, payload: InvoiceLineItemPayload) {
    const response = await apiClient.post(
      `/company/invoices/${invoiceId}/line-items`,
      payload,
    );
    return unwrapResponse<InvoiceLineItemRecord>(response.data);
  },
  async updateLineItem(lineItemId: number, payload: InvoiceLineItemPayload) {
    const response = await apiClient.put(
      `/company/invoice-line-items/${lineItemId}`,
      payload,
    );
    return unwrapResponse<InvoiceLineItemRecord>(response.data);
  },
  async removeLineItem(lineItemId: number) {
    await apiClient.delete(`/company/invoice-line-items/${lineItemId}`);
  },
  async previewBilling(payload: BillingPreviewPayload) {
    const response = await apiClient.post("/company/billing/preview", payload);
    return unwrapResponse<BillingPreviewRecord>(response.data);
  },
  async generateInvoice(payload: InvoiceGenerationPayload) {
    const response = await apiClient.post("/company/invoices/generate", payload);
    return unwrapResponse<InvoiceRecord>(response.data);
  },
  async searchPayments(params: {
    keyword: string;
    status: PaymentStatus | "";
    paymentMethod: PaymentMethod | "";
    fromDate: string;
    toDate: string;
    page: number;
    size: number;
    sortBy: string;
    sortDirection: "ASC" | "DESC";
  }) {
    const response = await apiClient.get("/company/payments", {
      params: compactParams({
        keyword: params.keyword,
        status: params.status || undefined,
        paymentMethod: params.paymentMethod || undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      }),
    });
    return unwrapResponse<PageResponse<PaymentSummaryRecord>>(response.data);
  },
  async getPayment(id: number) {
    const response = await apiClient.get(`/company/payments/${id}`);
    return unwrapResponse<PaymentRecord>(response.data);
  },
  async previewPayment(payload: PaymentPreviewPayload) {
    const response = await apiClient.post("/company/payments/preview", payload);
    return unwrapResponse<PaymentPreviewRecord>(response.data);
  },
  async createPayment(payload: PaymentPayload) {
    const response = await apiClient.post("/company/payments", payload);
    return unwrapResponse<PaymentRecord>(response.data);
  },
  async updatePayment(id: number, payload: PaymentPayload) {
    const response = await apiClient.put(`/company/payments/${id}`, payload);
    return unwrapResponse<PaymentRecord>(response.data);
  },
  async applyPayment(id: number) {
    const response = await apiClient.post(`/company/payments/${id}/apply`);
    return unwrapResponse<PaymentRecord>(response.data);
  },
  async voidPayment(id: number, reason: string) {
    const response = await apiClient.post(`/company/payments/${id}/void`, {
      reason,
    });
    return unwrapResponse<PaymentRecord>(response.data);
  },
  async listInvoicePayments(invoiceId: number) {
    const response = await apiClient.get(`/company/invoices/${invoiceId}/payments`);
    return unwrapResponse<PaymentSummaryRecord[]>(response.data);
  },
  async getReceivablesSummary() {
    const response = await apiClient.get("/company/receivables/summary");
    return unwrapResponse<ReceivablesSummaryRecord>(response.data);
  },
  async listCollectionNotes(invoiceId: number) {
    const response = await apiClient.get(`/company/invoices/${invoiceId}/collection-notes`);
    return unwrapResponse<CollectionNoteRecord[]>(response.data);
  },
  async addCollectionNote(invoiceId: number, payload: CollectionNotePayload) {
    const response = await apiClient.post(
      `/company/invoices/${invoiceId}/collection-notes`,
      payload,
    );
    return unwrapResponse<CollectionNoteRecord>(response.data);
  },
  async searchBillToOptions(type: BillToType, keyword: string) {
    if (type === "RIDER") {
      const response = await apiClient.get("/company/riders", {
        params: { keyword, page: 0, size: 25, sortBy: "updatedAt", sortDirection: "DESC" },
      });
      const page = unwrapResponse<PageResponse<{ id: number; riderCode: string; firstName: string; lastName: string }>>(response.data);
      return page.items.map((item) => ({
        id: item.id,
        label: `${item.firstName} ${item.lastName}`,
        secondaryLabel: item.riderCode,
      }));
    }
    if (type === "GUARDIAN") {
      const response = await apiClient.get("/company/guardians", {
        params: { keyword, page: 0, size: 25, sortBy: "updatedAt", sortDirection: "DESC" },
      });
      const page = unwrapResponse<PageResponse<{ id: number; firstName: string; lastName: string; phone: string }>>(response.data);
      return page.items.map((item) => ({
        id: item.id,
        label: `${item.firstName} ${item.lastName}`,
        secondaryLabel: item.phone,
      }));
    }
    if (type === "ORGANIZATION") {
      const response = await apiClient.get("/company/organizations", {
        params: { keyword, page: 0, size: 25, sortBy: "updatedAt", sortDirection: "DESC" },
      });
      const page = unwrapResponse<PageResponse<{ id: number; organizationCode: string; name: string }>>(response.data);
      return page.items.map((item) => ({
        id: item.id,
        label: item.name,
        secondaryLabel: item.organizationCode,
      }));
    }
    const response = await apiClient.get("/company/contracts", {
      params: { keyword, page: 0, size: 25, sortBy: "updatedAt", sortDirection: "DESC" },
    });
    const page = unwrapResponse<PageResponse<{ id: number; contractCode: string; contractName: string }>>(response.data);
    return page.items.map((item) => ({
      id: item.id,
      label: item.contractName,
      secondaryLabel: item.contractCode,
    }));
  },
  async searchPricingRuleOptions(keyword: string) {
    const response = await apiClient.get("/company/pricing-rules", {
      params: {
        keyword,
        page: 0,
        size: 25,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<PricingRuleSummaryRecord>>(response.data);
    return page.items.map((item) => ({
      id: item.id,
      label: item.name,
      secondaryLabel: item.pricingRuleCode,
    }));
  },
  async searchRideOptions(params: {
    keyword: string;
    fromDate?: string;
    toDate?: string;
    riderId?: number | null;
    organizationId?: number | null;
    contractId?: number | null;
  }) {
    const response = await apiClient.get("/company/rides", {
      params: compactParams({
        keyword: params.keyword,
        fromDate: params.fromDate,
        toDate: params.toDate,
        riderId: params.riderId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        contractId: params.contractId ?? undefined,
        page: 0,
        size: 25,
        sortBy: "scheduledPickupAt",
        sortDirection: "DESC",
      }),
    });
    const page = unwrapResponse<
      PageResponse<{
        id: number;
        rideNumber: string;
        riderName: string;
        serviceType: ServiceType;
        scheduledPickupAt: string;
      }>
    >(response.data);
    return page.items.map((item) => ({
      id: item.id,
      label: `${item.rideNumber} • ${item.riderName}`,
      secondaryLabel: `${item.serviceType.replaceAll("_", " ")} • ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.scheduledPickupAt))}`,
    }));
  },
};
