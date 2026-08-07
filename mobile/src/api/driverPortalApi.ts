import { apiClient, unwrapResponse } from './client';
import type { PageResponse } from './types';

export type DriverPortalRideStatus =
  | 'DRAFT' | 'REQUESTED' | 'PENDING_REVIEW' | 'SCHEDULED' | 'ASSIGNED'
  | 'DRIVER_EN_ROUTE' | 'ARRIVED' | 'RIDER_NO_SHOW' | 'PICKED_UP'
  | 'DROPPED_OFF' | 'COMPLETED' | 'CANCELLED' | 'MISSED' | 'FAILED';

export type DriverRideAction = 'en-route' | 'arrived' | 'pickup-complete' | 'dropoff-complete';

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
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  availabilitySummary?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
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

export interface DriverPortalComplianceSummaryRecord {
  unresolvedComplianceIssues: number;
  expiringDocumentsSoon: number;
  issues: DriverPortalComplianceIssueRecord[];
  documents: DriverPortalDocumentRecord[];
}

export interface DriverDocumentUploadPayload {
  documentType: string;
  uri: string;
  fileName: string;
  contentType: string;
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
  status: string;
  startTime: string | null;
  endTime: string | null;
  linkedRideCount: number;
}

export interface DriverPortalRouteDetailRecord extends DriverPortalRouteSummaryRecord {
  manifestNotes: string | null;
  notes: string | null;
  stops: DriverPortalRouteStopRecord[];
}

const base = '/portal/driver';

export const driverPortalApi = {
  async getDashboard() {
    const r = await apiClient.get(`${base}/dashboard`);
    return unwrapResponse<DriverPortalDashboardRecord>(r.data);
  },
  async getProfile() {
    const r = await apiClient.get(`${base}/profile`);
    return unwrapResponse<DriverPortalProfileRecord>(r.data);
  },
  async updateProfile(payload: DriverPortalProfilePayload) {
    const r = await apiClient.put(`${base}/profile`, payload);
    return unwrapResponse<DriverPortalProfileRecord>(r.data);
  },
  async getComplianceSummary() {
    const r = await apiClient.get(`${base}/compliance`);
    return unwrapResponse<DriverPortalComplianceSummaryRecord>(r.data);
  },
  async searchRides(params?: Record<string, unknown>) {
    const r = await apiClient.get(`${base}/rides`, { params });
    return unwrapResponse<PageResponse<DriverPortalRideSummaryRecord>>(r.data);
  },
  async getRide(rideId: number) {
    const r = await apiClient.get(`${base}/rides/${rideId}`);
    return unwrapResponse<DriverPortalRideDetailRecord>(r.data);
  },
  async postRideAction(rideId: number, action: DriverRideAction) {
    const r = await apiClient.post(`${base}/rides/${rideId}/${action}`);
    return unwrapResponse<DriverPortalRideDetailRecord>(r.data);
  },
  async addRideNote(rideId: number, note: string) {
    const r = await apiClient.post(`${base}/rides/${rideId}/notes`, { note });
    return unwrapResponse<DriverPortalRideDetailRecord>(r.data);
  },
  async searchRoutes(params?: Record<string, unknown>) {
    const r = await apiClient.get(`${base}/routes`, { params });
    return unwrapResponse<PageResponse<DriverPortalRouteSummaryRecord>>(r.data);
  },
  async getRoute(routeId: number) {
    const r = await apiClient.get(`${base}/routes/${routeId}`);
    return unwrapResponse<DriverPortalRouteDetailRecord>(r.data);
  },
  async getDocuments() {
    const r = await apiClient.get(`${base}/documents`);
    return unwrapResponse<DriverPortalDocumentRecord[]>(r.data);
  },
  async uploadDocument(payload: DriverDocumentUploadPayload) {
    const form = new FormData();
    form.append('documentType', payload.documentType);
    form.append('file', {
      uri: payload.uri,
      name: payload.fileName,
      type: payload.contentType,
    } as unknown as Blob);
    const r = await apiClient.post(`${base}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapResponse<DriverPortalDocumentRecord>(r.data);
  },
};
