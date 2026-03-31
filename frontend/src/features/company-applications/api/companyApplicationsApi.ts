import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type CompanyApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ONBOARDING"
  | "ACTIVE"
  | "SUSPENDED";

export interface CompanyApplicationReviewEvent {
  id: number;
  action: string;
  fromStatus?: CompanyApplicationStatus | null;
  toStatus: CompanyApplicationStatus;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CompanyApplication {
  id: number;
  applicationNumber: string;
  legalCompanyName: string;
  dbaName?: string | null;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  businessType: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  requestedServiceTypes: string[];
  fleetSize?: number | null;
  numberOfDrivers?: number | null;
  notes?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  status: CompanyApplicationStatus;
  approvedTenantId?: string | null;
  ownerUserId?: number | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  reviewEvents: CompanyApplicationReviewEvent[];
}

export interface CompanyApplicationSubmissionPayload {
  legalCompanyName: string;
  dbaName?: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  businessType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  requestedServiceTypes: string[];
  fleetSize?: number;
  numberOfDrivers?: number;
  notes?: string;
}

export interface CompanyApplicationReviewPayload {
  reviewNotes?: string;
  rejectionReason?: string;
  subscriptionPlan?: string;
  tenantCode?: string;
  ownerEmail: string;
}

export const companyApplicationsApi = {
  async submit(payload: CompanyApplicationSubmissionPayload) {
    const response = await apiClient.post("/company-applications", payload);
    return unwrapResponse<CompanyApplication>(response.data);
  },
  async search(params: { keyword: string; status: string; page: number; size: number }) {
    const response = await apiClient.get("/platform/company-applications", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<CompanyApplication>>(response.data);
  },
  async getById(applicationId: number) {
    const response = await apiClient.get(`/platform/company-applications/${applicationId}`);
    return unwrapResponse<CompanyApplication>(response.data);
  },
  async moveToUnderReview(applicationId: number, payload: CompanyApplicationReviewPayload) {
    const response = await apiClient.post(`/platform/company-applications/${applicationId}/under-review`, payload);
    return unwrapResponse<CompanyApplication>(response.data);
  },
  async approve(applicationId: number, payload: CompanyApplicationReviewPayload) {
    const response = await apiClient.post(`/platform/company-applications/${applicationId}/approve`, payload);
    return unwrapResponse<CompanyApplication>(response.data);
  },
  async reject(applicationId: number, payload: CompanyApplicationReviewPayload) {
    const response = await apiClient.post(`/platform/company-applications/${applicationId}/reject`, payload);
    return unwrapResponse<CompanyApplication>(response.data);
  },
};
