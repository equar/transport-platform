import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type TenantStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface Tenant {
  id: string;
  tenantCode: string;
  companyName: string;
  legalName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  businessType: string;
  subscriptionPlan: string;
  serviceTypesEnabled: string[];
  notes?: string | null;
  status: TenantStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TenantPayload {
  tenantCode: string;
  companyName: string;
  legalName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  businessType: string;
  subscriptionPlan: string;
  serviceTypesEnabled: string[];
  notes?: string;
}

export const tenantsApi = {
  async search(params: { keyword: string; status: string; page: number; size: number }) {
    const response = await apiClient.get("/platform/tenants", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<Tenant>>(response.data);
  },
  async getById(tenantId: string) {
    const response = await apiClient.get(`/platform/tenants/${tenantId}`);
    return unwrapResponse<Tenant>(response.data);
  },
  async create(payload: TenantPayload) {
    const response = await apiClient.post("/platform/tenants", payload);
    return unwrapResponse<Tenant>(response.data);
  },
  async update(tenantId: string, payload: TenantPayload) {
    const response = await apiClient.put(`/platform/tenants/${tenantId}`, payload);
    return unwrapResponse<Tenant>(response.data);
  },
  async activate(tenantId: string) {
    const response = await apiClient.post(`/platform/tenants/${tenantId}/activate`);
    return unwrapResponse<Tenant>(response.data);
  },
  async suspend(tenantId: string) {
    const response = await apiClient.post(`/platform/tenants/${tenantId}/suspend`);
    return unwrapResponse<Tenant>(response.data);
  },
};
