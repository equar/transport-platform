import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type RiderStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE"
  | "WAITLISTED";

export type RiderType =
  | "STUDENT"
  | "ELDERLY"
  | "NEMT"
  | "PRIVATE_PAY"
  | "EMPLOYEE_COMMUTER"
  | "OTHER";

export type RiderGender =
  | "FEMALE"
  | "MALE"
  | "NON_BINARY"
  | "UNSPECIFIED"
  | "OTHER";

export type RiderMobilityNeed =
  | "WALKER"
  | "CANE"
  | "WHEELCHAIR"
  | "STRETCHER"
  | "OXYGEN"
  | "VISUAL_ASSISTANCE"
  | "HEARING_ASSISTANCE"
  | "OTHER";

export type GuardianStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type RiderGuardianStatus = "ACTIVE" | "INACTIVE";

export type RiderGuardianRelationshipType =
  | "PARENT"
  | "SPOUSE"
  | "CHILD"
  | "SIBLING"
  | "CAREGIVER"
  | "FACILITY_COORDINATOR"
  | "OTHER";

export interface RiderGuardianRecord {
  id: number;
  riderId: number;
  guardianId: number;
  guardianFirstName: string;
  guardianLastName: string;
  guardianDisplayName: string;
  guardianEmail: string | null;
  guardianPhone: string | null;
  guardianStatus: GuardianStatus;
  relationshipType: RiderGuardianRelationshipType;
  primaryGuardian: boolean;
  authorizedForPickup: boolean;
  billingContact: boolean;
  status: RiderGuardianStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RiderRecord {
  id: number;
  tenantId: string;
  riderCode: string;
  riderType: RiderType;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  gender: RiderGender | null;
  email: string | null;
  primaryPhone: string;
  alternatePhone: string | null;
  homeAddressLine1: string | null;
  homeAddressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  defaultPickupAddress: string | null;
  defaultDropoffAddress: string | null;
  pickupNotes: string | null;
  dropoffNotes: string | null;
  preferredPickupWindowStart: string | null;
  preferredPickupWindowEnd: string | null;
  preferredDropoffWindowStart: string | null;
  preferredDropoffWindowEnd: string | null;
  mobilityNeeds: RiderMobilityNeed[];
  wheelchairRequired: boolean;
  escortRequired: boolean;
  specialInstructions: string | null;
  careNotesSummary: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  organizationId: number | null;
  notes: string | null;
  status: RiderStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  guardianCount: number;
  primaryGuardian: RiderGuardianRecord | null;
  guardians: RiderGuardianRecord[];
}

export interface RiderSearchParams {
  keyword: string;
  status: RiderStatus | "";
  riderType: RiderType | "";
  wheelchairRequired: boolean | "";
  escortRequired: boolean | "";
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface RiderPayload {
  riderType: RiderType;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: RiderGender | null;
  email?: string | null;
  primaryPhone: string;
  alternatePhone?: string | null;
  homeAddressLine1?: string | null;
  homeAddressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  defaultPickupAddress?: string | null;
  defaultDropoffAddress?: string | null;
  pickupNotes?: string | null;
  dropoffNotes?: string | null;
  preferredPickupWindowStart?: string | null;
  preferredPickupWindowEnd?: string | null;
  preferredDropoffWindowStart?: string | null;
  preferredDropoffWindowEnd?: string | null;
  mobilityNeeds: RiderMobilityNeed[];
  wheelchairRequired: boolean;
  escortRequired: boolean;
  specialInstructions?: string | null;
  careNotesSummary?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  organizationId?: number | null;
  notes?: string | null;
}

export interface RiderGuardianPayload {
  guardianId: number;
  relationshipType: RiderGuardianRelationshipType;
  primaryGuardian: boolean;
  authorizedForPickup: boolean;
  billingContact: boolean;
  notes?: string | null;
}

export const riderTypeOptions: RiderType[] = [
  "STUDENT",
  "ELDERLY",
  "NEMT",
  "PRIVATE_PAY",
  "EMPLOYEE_COMMUTER",
  "OTHER",
];

export const riderGenderOptions: RiderGender[] = [
  "FEMALE",
  "MALE",
  "NON_BINARY",
  "UNSPECIFIED",
  "OTHER",
];

export const riderMobilityNeedOptions: RiderMobilityNeed[] = [
  "WALKER",
  "CANE",
  "WHEELCHAIR",
  "STRETCHER",
  "OXYGEN",
  "VISUAL_ASSISTANCE",
  "HEARING_ASSISTANCE",
  "OTHER",
];

export const riderGuardianRelationshipTypeOptions: RiderGuardianRelationshipType[] = [
  "PARENT",
  "SPOUSE",
  "CHILD",
  "SIBLING",
  "CAREGIVER",
  "FACILITY_COORDINATOR",
  "OTHER",
];

export const ridersApi = {
  async search(params: RiderSearchParams) {
    const response = await apiClient.get("/company/riders", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        riderType: params.riderType || undefined,
        wheelchairRequired:
          params.wheelchairRequired === "" ? undefined : params.wheelchairRequired,
        escortRequired:
          params.escortRequired === "" ? undefined : params.escortRequired,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<RiderRecord>>(response.data);
  },
  async getById(riderId: number) {
    const response = await apiClient.get(`/company/riders/${riderId}`);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async create(payload: RiderPayload) {
    const response = await apiClient.post("/company/riders", payload);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async update(riderId: number, payload: RiderPayload) {
    const response = await apiClient.put(`/company/riders/${riderId}`, payload);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async activate(riderId: number) {
    const response = await apiClient.post(`/company/riders/${riderId}/activate`);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async suspend(riderId: number) {
    const response = await apiClient.post(`/company/riders/${riderId}/suspend`);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async waitlist(riderId: number) {
    const response = await apiClient.post(`/company/riders/${riderId}/waitlist`);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async deactivate(riderId: number) {
    const response = await apiClient.post(`/company/riders/${riderId}/deactivate`);
    return unwrapResponse<RiderRecord>(response.data);
  },
  async listGuardians(riderId: number) {
    const response = await apiClient.get(`/company/riders/${riderId}/guardians`);
    return unwrapResponse<RiderGuardianRecord[]>(response.data);
  },
  async linkGuardian(riderId: number, payload: RiderGuardianPayload) {
    const response = await apiClient.post(
      `/company/riders/${riderId}/guardians`,
      payload,
    );
    return unwrapResponse<RiderGuardianRecord>(response.data);
  },
  async updateGuardianLink(relationshipId: number, payload: RiderGuardianPayload) {
    const response = await apiClient.put(
      `/company/rider-guardians/${relationshipId}`,
      payload,
    );
    return unwrapResponse<RiderGuardianRecord>(response.data);
  },
  async unlinkGuardian(relationshipId: number) {
    const response = await apiClient.post(
      `/company/rider-guardians/${relationshipId}/unlink`,
    );
    return unwrapResponse<RiderGuardianRecord>(response.data);
  },
};