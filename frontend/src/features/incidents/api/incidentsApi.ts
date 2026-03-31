import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export const incidentStatusOptions = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "CLOSED",
  "ESCALATED",
  "DISMISSED",
] as const;

export const incidentSeverityOptions = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const incidentTypeOptions = [
  "RIDER_COMPLAINT",
  "DRIVER_COMPLAINT",
  "SAFETY_INCIDENT",
  "VEHICLE_INCIDENT",
  "NO_SHOW_ESCALATION",
  "SERVICE_QUALITY_COMPLAINT",
  "CONDUCT_ISSUE",
  "DOCUMENTATION_COMPLIANCE_ISSUE",
  "OTHER_OPERATIONAL_INCIDENT",
] as const;

export type IncidentStatus = (typeof incidentStatusOptions)[number];
export type IncidentSeverity = (typeof incidentSeverityOptions)[number];
export type IncidentType = (typeof incidentTypeOptions)[number];

export interface IncidentReferenceOption {
  id: number;
  label: string;
}

export interface IncidentReferenceData {
  users: IncidentReferenceOption[];
  rides: IncidentReferenceOption[];
  drivers: IncidentReferenceOption[];
  vehicles: IncidentReferenceOption[];
  riders: IncidentReferenceOption[];
  guardians: IncidentReferenceOption[];
  organizations: IncidentReferenceOption[];
}

export interface IncidentSummaryRecord {
  id: number;
  incidentCode: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  reportedAt: string | null;
  reportedByNameSnapshot: string | null;
  assignedToUserId: number | null;
  assignedToName: string | null;
  relatedRideId: number | null;
  relatedRideCode: string | null;
  relatedDriverId: number | null;
  relatedDriverCode: string | null;
  relatedVehicleId: number | null;
  relatedVehicleCode: string | null;
  relatedRiderId: number | null;
  relatedRiderCode: string | null;
  relatedOrganizationId: number | null;
  relatedOrganizationName: string | null;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentDetailRecord extends IncidentSummaryRecord {
  tenantId: string;
  description: string;
  reportedByUserId: number | null;
  relatedGuardianId: number | null;
  relatedGuardianName: string | null;
  resolutionSummary: string | null;
  rootCauseSummary: string | null;
  correctiveActionSummary: string | null;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface IncidentSearchParams {
  keyword: string;
  status: IncidentStatus | "";
  severity: IncidentSeverity | "";
  incidentType: IncidentType | "";
  assignedToUserId: number | null;
  fromDate: string;
  toDate: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface IncidentPayload {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status?: IncidentStatus | null;
  title: string;
  description: string;
  reportedAt?: string | null;
  reportedByNameSnapshot?: string | null;
  relatedRideId?: number | null;
  relatedDriverId?: number | null;
  relatedVehicleId?: number | null;
  relatedRiderId?: number | null;
  relatedGuardianId?: number | null;
  relatedOrganizationId?: number | null;
  assignedToUserId?: number | null;
  resolutionSummary?: string | null;
  rootCauseSummary?: string | null;
  correctiveActionSummary?: string | null;
  notes?: string | null;
}

export interface IncidentStatusActionPayload {
  resolutionSummary?: string | null;
  rootCauseSummary?: string | null;
  correctiveActionSummary?: string | null;
  notes?: string | null;
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanActionPayload(payload?: IncidentStatusActionPayload) {
  return {
    resolutionSummary: cleanText(payload?.resolutionSummary),
    rootCauseSummary: cleanText(payload?.rootCauseSummary),
    correctiveActionSummary: cleanText(payload?.correctiveActionSummary),
    notes: cleanText(payload?.notes),
  };
}

function cleanIncidentPayload(payload: IncidentPayload) {
  return {
    incidentType: payload.incidentType,
    severity: payload.severity,
    status: payload.status ?? undefined,
    title: payload.title.trim(),
    description: payload.description.trim(),
    reportedAt: payload.reportedAt || undefined,
    reportedByNameSnapshot: cleanText(payload.reportedByNameSnapshot),
    relatedRideId: payload.relatedRideId ?? undefined,
    relatedDriverId: payload.relatedDriverId ?? undefined,
    relatedVehicleId: payload.relatedVehicleId ?? undefined,
    relatedRiderId: payload.relatedRiderId ?? undefined,
    relatedGuardianId: payload.relatedGuardianId ?? undefined,
    relatedOrganizationId: payload.relatedOrganizationId ?? undefined,
    assignedToUserId: payload.assignedToUserId ?? undefined,
    resolutionSummary: cleanText(payload.resolutionSummary),
    rootCauseSummary: cleanText(payload.rootCauseSummary),
    correctiveActionSummary: cleanText(payload.correctiveActionSummary),
    notes: cleanText(payload.notes),
  };
}

async function postAction(
  incidentId: number,
  action: string,
  payload?: IncidentStatusActionPayload,
) {
  const response = await apiClient.post(
    `/company/incidents/${incidentId}/${action}`,
    cleanActionPayload(payload),
  );
  return unwrapResponse<IncidentDetailRecord>(response.data);
}

export const incidentsApi = {
  async search(params: IncidentSearchParams) {
    const response = await apiClient.get("/company/incidents", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        severity: params.severity || undefined,
        incidentType: params.incidentType || undefined,
        assignedToUserId: params.assignedToUserId ?? undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<IncidentSummaryRecord>>(response.data);
  },
  async getReferenceData() {
    const response = await apiClient.get("/company/incidents/reference-data");
    return unwrapResponse<IncidentReferenceData>(response.data);
  },
  async getById(incidentId: number) {
    const response = await apiClient.get(`/company/incidents/${incidentId}`);
    return unwrapResponse<IncidentDetailRecord>(response.data);
  },
  async create(payload: IncidentPayload) {
    const response = await apiClient.post(
      "/company/incidents",
      cleanIncidentPayload(payload),
    );
    return unwrapResponse<IncidentDetailRecord>(response.data);
  },
  async update(incidentId: number, payload: IncidentPayload) {
    const response = await apiClient.put(
      `/company/incidents/${incidentId}`,
      cleanIncidentPayload(payload),
    );
    return unwrapResponse<IncidentDetailRecord>(response.data);
  },
  async moveToInReview(incidentId: number, payload?: IncidentStatusActionPayload) {
    return postAction(incidentId, "in-review", payload);
  },
  async escalate(incidentId: number, payload?: IncidentStatusActionPayload) {
    return postAction(incidentId, "escalate", payload);
  },
  async resolve(incidentId: number, payload: IncidentStatusActionPayload) {
    return postAction(incidentId, "resolve", payload);
  },
  async close(incidentId: number, payload?: IncidentStatusActionPayload) {
    return postAction(incidentId, "close", payload);
  },
  async dismiss(incidentId: number, payload?: IncidentStatusActionPayload) {
    return postAction(incidentId, "dismiss", payload);
  },
  async reopen(incidentId: number, payload?: IncidentStatusActionPayload) {
    return postAction(incidentId, "reopen", payload);
  },
};