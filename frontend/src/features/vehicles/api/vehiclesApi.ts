import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export const vehicleServiceTypeOptions = [
  "NEMT",
  "WHEELCHAIR",
  "PARATRANSIT",
  "SCHOOL_TRANSPORT",
  "SHARED_RIDE",
  "MEDICAL_ESCORT",
] as const;

export type VehicleServiceType = (typeof vehicleServiceTypeOptions)[number];

export type VehicleStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "SUSPENDED";

export type VehicleOwnershipType =
  | "COMPANY_OWNED"
  | "DRIVER_OWNED"
  | "LEASED";

export type VehicleFuelType =
  | "GASOLINE"
  | "DIESEL"
  | "HYBRID"
  | "ELECTRIC"
  | "PROPANE"
  | "OTHER";

export type VehicleComplianceStatus =
  | "COMPLIANT"
  | "ACTION_REQUIRED"
  | "NON_COMPLIANT";

export type VehicleDocumentType =
  | "VEHICLE_REGISTRATION"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_INSPECTION"
  | "TITLE"
  | "LEASE_AGREEMENT"
  | "WHEELCHAIR_EQUIPMENT_CERTIFICATION"
  | "MAINTENANCE_RECORD"
  | "VEHICLE_PHOTO"
  | "OTHER";

export type VehicleDocumentStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type VehicleDocumentVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface VehicleComplianceSummary {
  requiredDocumentCount: number;
  uploadedDocumentCount: number;
  verifiedDocumentCount: number;
  expiredDocumentCount: number;
  missingRequiredDocumentCount: number;
  overallStatus: VehicleComplianceStatus;
  daysUntilNextExpiringDocument: number | null;
  missingRequiredDocumentTypes: VehicleDocumentType[];
}

export interface VehicleRecord {
  id: number;
  tenantId: string;
  vehicleCode: string;
  ownershipType: VehicleOwnershipType;
  make: string;
  model: string;
  year: number;
  color: string | null;
  vin: string | null;
  plateNumber: string;
  plateState: string;
  capacity: number;
  wheelchairCapacity: number | null;
  serviceTypesSupported: string[];
  fuelType: VehicleFuelType | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;
  registrationExpiryDate: string | null;
  inspectionExpiryDate: string | null;
  mileage: number | null;
  assignedDriverId: number | null;
  notes: string | null;
  status: VehicleStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  complianceSummary: VehicleComplianceSummary;
}

export interface VehicleDocumentRecord {
  id: number;
  vehicleId: number;
  documentType: VehicleDocumentType;
  fileName: string;
  originalFileName: string | null;
  contentType: string | null;
  storagePath: string | null;
  documentNumber: string | null;
  issuingAuthority: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  verificationStatus: VehicleDocumentVerificationStatus;
  status: VehicleDocumentStatus;
  notes: string | null;
  uploadedBy: string;
  uploadedAt: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface VehicleSearchParams {
  keyword: string;
  status: VehicleStatus | "";
  ownershipType: VehicleOwnershipType | "";
  serviceType: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface VehicleDocumentSearchParams {
  documentType: VehicleDocumentType | "";
  verificationStatus: VehicleDocumentVerificationStatus | "";
  status: VehicleDocumentStatus | "";
  page: number;
  size: number;
}

export interface VehiclePayload {
  ownershipType: VehicleOwnershipType;
  make: string;
  model: string;
  year: number;
  color?: string | null;
  vin?: string | null;
  plateNumber: string;
  plateState: string;
  capacity: number;
  wheelchairCapacity?: number | null;
  serviceTypesSupported: string[];
  fuelType?: VehicleFuelType | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiryDate?: string | null;
  registrationExpiryDate?: string | null;
  inspectionExpiryDate?: string | null;
  mileage?: number | null;
  assignedDriverId?: number | null;
  notes?: string | null;
}

export interface VehicleDocumentPayload {
  documentType: VehicleDocumentType;
  fileName: string;
  originalFileName?: string | null;
  contentType?: string | null;
  storagePath?: string | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

export interface VehicleDocumentReviewPayload {
  notes?: string | null;
}

export const vehiclesApi = {
  async search(params: VehicleSearchParams) {
    const response = await apiClient.get("/company/vehicles", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        ownershipType: params.ownershipType || undefined,
        serviceType: params.serviceType || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<VehicleRecord>>(response.data);
  },
  async getById(vehicleId: number) {
    const response = await apiClient.get(`/company/vehicles/${vehicleId}`);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async create(payload: VehiclePayload) {
    const response = await apiClient.post("/company/vehicles", payload);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async update(vehicleId: number, payload: VehiclePayload) {
    const response = await apiClient.put(`/company/vehicles/${vehicleId}`, payload);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async activate(vehicleId: number) {
    const response = await apiClient.post(`/company/vehicles/${vehicleId}/activate`);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async suspend(vehicleId: number) {
    const response = await apiClient.post(`/company/vehicles/${vehicleId}/suspend`);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async markMaintenance(vehicleId: number) {
    const response = await apiClient.post(`/company/vehicles/${vehicleId}/maintenance`);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async markOutOfService(vehicleId: number) {
    const response = await apiClient.post(
      `/company/vehicles/${vehicleId}/out-of-service`,
    );
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async deactivate(vehicleId: number) {
    const response = await apiClient.post(`/company/vehicles/${vehicleId}/deactivate`);
    return unwrapResponse<VehicleRecord>(response.data);
  },
  async listDocuments(vehicleId: number, params: VehicleDocumentSearchParams) {
    const response = await apiClient.get(`/company/vehicles/${vehicleId}/documents`, {
      params: {
        documentType: params.documentType || undefined,
        verificationStatus: params.verificationStatus || undefined,
        status: params.status || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<VehicleDocumentRecord>>(response.data);
  },
  async createDocument(vehicleId: number, payload: VehicleDocumentPayload) {
    const response = await apiClient.post(
      `/company/vehicles/${vehicleId}/documents`,
      payload,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
  async updateDocument(documentId: number, payload: VehicleDocumentPayload) {
    const response = await apiClient.put(
      `/company/vehicle-documents/${documentId}`,
      payload,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
  async verifyDocument(documentId: number, payload: VehicleDocumentReviewPayload) {
    const response = await apiClient.post(
      `/company/vehicle-documents/${documentId}/verify`,
      payload,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
  async rejectDocument(documentId: number, payload: VehicleDocumentReviewPayload) {
    const response = await apiClient.post(
      `/company/vehicle-documents/${documentId}/reject`,
      payload,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
  async activateDocument(documentId: number) {
    const response = await apiClient.post(
      `/company/vehicle-documents/${documentId}/activate`,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
  async archiveDocument(documentId: number) {
    const response = await apiClient.post(
      `/company/vehicle-documents/${documentId}/archive`,
    );
    return unwrapResponse<VehicleDocumentRecord>(response.data);
  },
};