import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";
import type {
  RiderGuardianRelationshipType,
  RiderGuardianStatus,
  RiderStatus,
  RiderType,
} from "../../riders/api/ridersApi";

export type GuardianStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type GuardianPreferredCommunicationMethod = "PHONE" | "SMS" | "EMAIL";

export interface GuardianLinkedRiderRecord {
  relationshipId: number;
  riderId: number;
  riderCode: string;
  riderDisplayName: string;
  riderType: RiderType;
  riderStatus: RiderStatus;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  relationshipType: RiderGuardianRelationshipType;
  primaryGuardian: boolean;
  authorizedForPickup: boolean;
  billingContact: boolean;
  status: RiderGuardianStatus;
  notes: string | null;
}

export interface GuardianRecord {
  id: number;
  tenantId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  relationToRiderDefault: string | null;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  preferredCommunicationMethod: GuardianPreferredCommunicationMethod | null;
  billingContact: boolean;
  authorizedForPickup: boolean;
  notes: string | null;
  status: GuardianStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  linkedRiderCount: number;
  riders: GuardianLinkedRiderRecord[];
}

export interface GuardianSearchParams {
  keyword: string;
  status: GuardianStatus | "";
  authorizedForPickup: boolean | "";
  billingContact: boolean | "";
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface GuardianPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  relationToRiderDefault?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  preferredCommunicationMethod?: GuardianPreferredCommunicationMethod | null;
  billingContact: boolean;
  authorizedForPickup: boolean;
  notes?: string | null;
}

export const guardianPreferredCommunicationMethodOptions: GuardianPreferredCommunicationMethod[] = [
  "PHONE",
  "SMS",
  "EMAIL",
];

export const guardiansApi = {
  async search(params: GuardianSearchParams) {
    const response = await apiClient.get("/company/guardians", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        authorizedForPickup:
          params.authorizedForPickup === "" ? undefined : params.authorizedForPickup,
        billingContact:
          params.billingContact === "" ? undefined : params.billingContact,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<GuardianRecord>>(response.data);
  },
  async getById(guardianId: number) {
    const response = await apiClient.get(`/company/guardians/${guardianId}`);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async create(payload: GuardianPayload) {
    const response = await apiClient.post("/company/guardians", payload);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async update(guardianId: number, payload: GuardianPayload) {
    const response = await apiClient.put(`/company/guardians/${guardianId}`, payload);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async activate(guardianId: number) {
    const response = await apiClient.post(`/company/guardians/${guardianId}/activate`);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async suspend(guardianId: number) {
    const response = await apiClient.post(`/company/guardians/${guardianId}/suspend`);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async deactivate(guardianId: number) {
    const response = await apiClient.post(`/company/guardians/${guardianId}/deactivate`);
    return unwrapResponse<GuardianRecord>(response.data);
  },
  async listRiders(guardianId: number) {
    const response = await apiClient.get(`/company/guardians/${guardianId}/riders`);
    return unwrapResponse<GuardianLinkedRiderRecord[]>(response.data);
  },
};