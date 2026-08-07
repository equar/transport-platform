import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type DriverStatus =
  | "APPLIED"
  | "PENDING_REVIEW"
  | "DOCUMENT_PENDING"
  | "TRAINING_PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "TERMINATED";

export type DriverType = "EMPLOYEE" | "CONTRACTOR";
export type DriverQualificationStatus =
  | "PENDING"
  | "CLEAR"
  | "FAILED"
  | "EXPIRED";
export type DriverTrainingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED";
export type DriverComplianceStatus =
  | "COMPLIANT"
  | "ACTION_REQUIRED"
  | "NON_COMPLIANT";
export type DriverDocumentType =
  | "DRIVER_LICENSE"
  | "BACKGROUND_CHECK"
  | "DRUG_TEST"
  | "CPR_FIRST_AID"
  | "NEMT_CERTIFICATION"
  | "SCHOOL_TRANSPORT_PERMIT"
  | "PROFILE_PHOTO"
  | "INSURANCE_PROOF"
  | "W9"
  | "CONTRACT_AGREEMENT"
  | "OTHER";
export type DriverDocumentStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type DriverDocumentVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface DriverComplianceSummary {
  requiredDocumentCount: number;
  uploadedDocumentCount: number;
  verifiedDocumentCount: number;
  expiredDocumentCount: number;
  missingRequiredDocumentCount: number;
  overallStatus: DriverComplianceStatus;
  daysUntilNextExpiringDocument: number | null;
  missingRequiredDocumentTypes: DriverDocumentType[];
}

export interface DriverRecord {
  id: number;
  tenantId: string;
  driverCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  driverType: DriverType;
  status: DriverStatus;
  hireDate: string | null;
  startDate: string | null;
  availabilitySummary: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiryDate: string | null;
  backgroundCheckStatus: DriverQualificationStatus;
  backgroundCheckExpiryDate: string | null;
  drugTestStatus: DriverQualificationStatus;
  drugTestExpiryDate: string | null;
  trainingStatus: DriverTrainingStatus;
  trainingCompletionDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  complianceSummary: DriverComplianceSummary;
}

export interface DriverDocumentRecord {
  id: number;
  driverId: number;
  documentType: DriverDocumentType;
  fileName: string;
  originalFileName: string | null;
  contentType: string | null;
  storagePath: string | null;
  documentNumber: string | null;
  issuingAuthority: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  verificationStatus: DriverDocumentVerificationStatus;
  status: DriverDocumentStatus;
  notes: string | null;
  uploadedBy: string;
  uploadedAt: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DriverSearchParams {
  keyword: string;
  status: DriverStatus | "";
  driverType: DriverType | "";
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface DriverDocumentSearchParams {
  documentType: DriverDocumentType | "";
  verificationStatus: DriverDocumentVerificationStatus | "";
  status: DriverDocumentStatus | "";
  page: number;
  size: number;
}

export interface DriverPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  driverType: DriverType;
  hireDate?: string | null;
  startDate?: string | null;
  availabilitySummary?: string | null;
  licenseNumber?: string | null;
  licenseState?: string | null;
  licenseExpiryDate?: string | null;
  backgroundCheckStatus?: DriverQualificationStatus | null;
  backgroundCheckExpiryDate?: string | null;
  drugTestStatus?: DriverQualificationStatus | null;
  drugTestExpiryDate?: string | null;
  trainingStatus?: DriverTrainingStatus | null;
  trainingCompletionDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  notes?: string | null;
}

export interface DriverDocumentPayload {
  documentType: DriverDocumentType;
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

export interface DriverDocumentReviewPayload {
  notes?: string | null;
}

export const driversApi = {
  async search(params: DriverSearchParams) {
    const response = await apiClient.get("/company/drivers", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        driverType: params.driverType || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<DriverRecord>>(response.data);
  },
  async getById(driverId: number) {
    const response = await apiClient.get(`/company/drivers/${driverId}`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async create(payload: DriverPayload) {
    const response = await apiClient.post("/company/drivers", payload);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async update(driverId: number, payload: DriverPayload) {
    const response = await apiClient.put(`/company/drivers/${driverId}`, payload);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async review(driverId: number) {
    const response = await apiClient.post(`/company/drivers/${driverId}/review`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async completeDocuments(driverId: number) {
    const response = await apiClient.post(
      `/company/drivers/${driverId}/documents-complete`,
    );
    return unwrapResponse<DriverRecord>(response.data);
  },
  async activate(driverId: number) {
    const response = await apiClient.post(`/company/drivers/${driverId}/activate`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async suspend(driverId: number) {
    const response = await apiClient.post(`/company/drivers/${driverId}/suspend`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async deactivate(driverId: number) {
    const response = await apiClient.post(`/company/drivers/${driverId}/deactivate`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async terminate(driverId: number) {
    const response = await apiClient.post(`/company/drivers/${driverId}/terminate`);
    return unwrapResponse<DriverRecord>(response.data);
  },
  async listDocuments(driverId: number, params: DriverDocumentSearchParams) {
    const response = await apiClient.get(`/company/drivers/${driverId}/documents`, {
      params: {
        documentType: params.documentType || undefined,
        verificationStatus: params.verificationStatus || undefined,
        status: params.status || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<DriverDocumentRecord>>(response.data);
  },
  async listAllDocuments(driverId: number) {
    const response = await apiClient.get(
      `/company/drivers/${driverId}/documents/all`,
    );
    return unwrapResponse<DriverDocumentRecord[]>(response.data);
  },
  async createDocument(driverId: number, payload: DriverDocumentPayload) {
    const response = await apiClient.post(
      `/company/drivers/${driverId}/documents`,
      payload,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
  async updateDocument(documentId: number, payload: DriverDocumentPayload) {
    const response = await apiClient.put(
      `/company/driver-documents/${documentId}`,
      payload,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
  async downloadDocument(documentId: number) {
    const response = await apiClient.get(
      `/company/driver-documents/${documentId}/content`,
      { responseType: "blob" },
    );
    return response.data as Blob;
  },
  async verifyDocument(documentId: number, payload: DriverDocumentReviewPayload) {
    const response = await apiClient.post(
      `/company/driver-documents/${documentId}/verify`,
      payload,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
  async rejectDocument(documentId: number, payload: DriverDocumentReviewPayload) {
    const response = await apiClient.post(
      `/company/driver-documents/${documentId}/reject`,
      payload,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
  async activateDocument(documentId: number) {
    const response = await apiClient.post(
      `/company/driver-documents/${documentId}/activate`,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
  async archiveDocument(documentId: number) {
    const response = await apiClient.post(
      `/company/driver-documents/${documentId}/archive`,
    );
    return unwrapResponse<DriverDocumentRecord>(response.data);
  },
};
