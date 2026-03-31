import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type DriverPortalRideStatus =
  | "DRAFT"
  | "REQUESTED"
  | "PENDING_REVIEW"
  | "SCHEDULED"
  | "ASSIGNED"
  | "DRIVER_EN_ROUTE"
  | "ARRIVED"
  | "RIDER_NO_SHOW"
  | "PICKED_UP"
  | "DROPPED_OFF"
  | "COMPLETED"
  | "CANCELLED"
  | "MISSED"
  | "FAILED";

export type DriverPortalRouteStatus =
  | "DRAFT"
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface DriverPortalDashboardRecord {
  ridesToday: number;
  assignedRides: number;
  activeRoutesToday: number;
  unresolvedComplianceIssues: number;
  expiringDocumentsSoon: number;
  unreadNotifications: number;
}

export interface DriverPortalProfileRecord {
  id: number;
  driverCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  availabilitySummary: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  notes: string | null;
  status: string;
  licenseExpiryDate: string | null;
  backgroundCheckExpiryDate: string | null;
  drugTestExpiryDate: string | null;
  trainingCompletionDate: string | null;
  updatedAt: string | null;
}

export interface DriverPortalProfilePayload {
  phone: string;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  availabilitySummary?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  notes?: string | null;
}

export interface DriverPortalDocumentRecord {
  id: number;
  documentType: string;
  fileName: string;
  issueDate: string | null;
  expiryDate: string | null;
  verificationStatus: string;
  status: string;
  notes: string | null;
}

export interface DriverPortalComplianceIssueRecord {
  id: number;
  issueType: string;
  severity: string;
  issueStatus: string;
  summary: string;
  recommendedAction: string | null;
  relatedDocumentType: string | null;
  expiryDate: string | null;
  updatedAt: string | null;
}

export interface DriverPortalComplianceSummaryRecord {
  unresolvedComplianceIssues: number;
  expiringDocumentsSoon: number;
  issues: DriverPortalComplianceIssueRecord[];
  documents: DriverPortalDocumentRecord[];
}

export interface DriverPortalRideSummaryRecord {
  id: number;
  rideNumber: string;
  status: DriverPortalRideStatus;
  serviceType: string;
  tripType: string;
  scheduledPickupAt: string;
  scheduledDropoffAt: string | null;
  riderName: string;
  guardianName: string | null;
  organizationName: string | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  routeId: number | null;
}

export interface DriverPortalRideDetailRecord extends DriverPortalRideSummaryRecord {
  returnPickupAt: string | null;
  returnDropoffAt: string | null;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  companionCount: number;
  specialInstructions: string | null;
  operationalNotes: string | null;
}

export interface DriverPortalRouteStopRecord {
  id: number;
  stopSequence: number;
  status: string;
  rideId: number;
  rideNumber: string;
  riderName: string;
  plannedPickupAt: string | null;
  plannedDropoffAt: string | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
}

export interface DriverPortalRouteSummaryRecord {
  id: number;
  routeCode: string;
  routeName: string;
  routeDate: string;
  serviceType: string;
  status: DriverPortalRouteStatus;
  startTime: string | null;
  endTime: string | null;
  linkedRideCount: number;
}

export interface DriverPortalRouteDetailRecord extends DriverPortalRouteSummaryRecord {
  manifestNotes: string | null;
  notes: string | null;
  stops: DriverPortalRouteStopRecord[];
}

const basePath = "/portal/driver";

export const driverPortalApi = {
  async getDashboard() {
    const response = await apiClient.get(`${basePath}/dashboard`);
    return unwrapResponse<DriverPortalDashboardRecord>(response.data);
  },
  async getProfile() {
    const response = await apiClient.get(`${basePath}/profile`);
    return unwrapResponse<DriverPortalProfileRecord>(response.data);
  },
  async updateProfile(payload: DriverPortalProfilePayload) {
    const response = await apiClient.put(`${basePath}/profile`, payload);
    return unwrapResponse<DriverPortalProfileRecord>(response.data);
  },
  async getComplianceSummary() {
    const response = await apiClient.get(`${basePath}/compliance`);
    return unwrapResponse<DriverPortalComplianceSummaryRecord>(response.data);
  },
  async searchRides(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/rides`, { params });
    return unwrapResponse<PageResponse<DriverPortalRideSummaryRecord>>(response.data);
  },
  async getRide(rideId: number) {
    const response = await apiClient.get(`${basePath}/rides/${rideId}`);
    return unwrapResponse<DriverPortalRideDetailRecord>(response.data);
  },
  async addRideNote(rideId: number, note: string) {
    const response = await apiClient.post(`${basePath}/rides/${rideId}/notes`, { note });
    return unwrapResponse<DriverPortalRideDetailRecord>(response.data);
  },
  async postRideAction(rideId: number, action: string) {
    const response = await apiClient.post(`${basePath}/rides/${rideId}/actions/${action}`);
    return unwrapResponse<DriverPortalRideDetailRecord>(response.data);
  },
  async searchRoutes(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/routes`, { params });
    return unwrapResponse<PageResponse<DriverPortalRouteSummaryRecord>>(response.data);
  },
  async getRoute(routeId: number) {
    const response = await apiClient.get(`${basePath}/routes/${routeId}`);
    return unwrapResponse<DriverPortalRouteDetailRecord>(response.data);
  },
};