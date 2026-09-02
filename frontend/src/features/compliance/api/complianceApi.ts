import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type ComplianceEntityType = "DRIVER" | "VEHICLE";
export type ComplianceIssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ComplianceIssueStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
export type ComplianceIssueType =
  | "MISSING_REQUIRED_DOCUMENT"
  | "EXPIRED_DOCUMENT"
  | "EXPIRING_SOON"
  | "REJECTED_DOCUMENT"
  | "UNVERIFIED_DOCUMENT"
  | "BLOCKED_FOR_ASSIGNMENT"
  | "OTHER";

export interface ComplianceSeveritySummaryRecord {
  severity: ComplianceIssueSeverity;
  issueCount: number;
}

export interface ComplianceDashboardSummaryRecord {
  openComplianceIssues: number;
  criticalComplianceIssues: number;
  driversMissingRequiredDocuments: number;
  driversExpiredDocuments: number;
  driversDocumentsExpiringSoon: number;
  vehiclesMissingRequiredDocuments: number;
  vehiclesExpiredDocuments: number;
  vehiclesDocumentsExpiringSoon: number;
  expiredDocuments: number;
  documentsExpiringSoon: number;
  severityBreakdown: ComplianceSeveritySummaryRecord[];
}

export interface ComplianceIssueSummaryRecord {
  id: number;
  entityType: ComplianceEntityType;
  entityId: string;
  entityCode: string;
  entityNameSummary: string;
  issueType: ComplianceIssueType;
  severity: ComplianceIssueSeverity;
  relatedDocumentType: string | null;
  expiryDate: string | null;
  summary: string;
  issueStatus: ComplianceIssueStatus;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface ComplianceIssueDetailRecord extends ComplianceIssueSummaryRecord {
  tenantId: string;
  sourceKey: string;
  recommendedAction: string | null;
  createdBy: string | null;
  createdAt: string;
}

export const complianceEntityTypeOptions: ComplianceEntityType[] = ["DRIVER", "VEHICLE"];
export const complianceIssueSeverityOptions: ComplianceIssueSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const complianceIssueStatusOptions: ComplianceIssueStatus[] = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"];

export interface TransportComplianceRecord {
  tenantId: string;
  operatingScope: "STUDENT_AND_WORKFORCE" | "STUDENT_ONLY" | "WORKFORCE_ONLY";
  verificationStatus: "INCOMPLETE" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  primaryState: string;
  operatingAuthorityType: string | null;
  operatingAuthorityNumber: string | null;
  operatingAuthorityExpiresOn: string | null;
  insuranceVerified: boolean;
  insuranceExpiresOn: string | null;
  studentSafeguardingPolicyVerified: boolean;
  ferpaDataAgreementVerified: boolean;
  employeeTransportConsentPolicyVerified: boolean;
  accessibilityPolicyVerified: boolean;
  verificationNotes: string | null;
}

export type TransportCompliancePayload = Omit<TransportComplianceRecord,
  "tenantId" | "verificationStatus" | "verificationNotes">;

export const complianceApi = {
  async getSummary() {
    const response = await apiClient.get("/company/compliance/summary");
    return unwrapResponse<ComplianceDashboardSummaryRecord>(response.data);
  },
  async searchIssues(params: Record<string, unknown>) {
    const response = await apiClient.get("/company/compliance/issues", { params });
    return unwrapResponse<PageResponse<ComplianceIssueSummaryRecord>>(response.data);
  },
  async getIssue(issueId: number) {
    const response = await apiClient.get(`/company/compliance/issues/${issueId}`);
    return unwrapResponse<ComplianceIssueDetailRecord>(response.data);
  },
  async acknowledgeIssue(issueId: number) {
    const response = await apiClient.post(`/company/compliance/issues/${issueId}/acknowledge`);
    return unwrapResponse<ComplianceIssueDetailRecord>(response.data);
  },
  async resolveIssue(issueId: number) {
    const response = await apiClient.post(`/company/compliance/issues/${issueId}/resolve`);
    return unwrapResponse<ComplianceIssueDetailRecord>(response.data);
  },
  async dismissIssue(issueId: number) {
    const response = await apiClient.post(`/company/compliance/issues/${issueId}/dismiss`);
    return unwrapResponse<ComplianceIssueDetailRecord>(response.data);
  },
  async getTransportProfile() {
    const response = await apiClient.get("/company/transport-compliance");
    return unwrapResponse<TransportComplianceRecord | null>(response.data);
  },
  async attestTransportProfile(payload: TransportCompliancePayload) {
    const response = await apiClient.put("/company/transport-compliance", payload);
    return unwrapResponse<TransportComplianceRecord>(response.data);
  },
  async getTenantTransportProfile(tenantId: string) {
    const response = await apiClient.get(`/platform/tenants/${tenantId}/transport-compliance`);
    return unwrapResponse<TransportComplianceRecord | null>(response.data);
  },
  async decideTenantTransportProfile(tenantId: string, approved: boolean, notes: string) {
    const response = await apiClient.post(`/platform/tenants/${tenantId}/transport-compliance/decision`, { approved, notes });
    return unwrapResponse<TransportComplianceRecord>(response.data);
  },
};
