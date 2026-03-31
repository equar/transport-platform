import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export interface RiderGuardianPortalDashboardRecord {
  scopeType: "RIDER" | "GUARDIAN";
  linkedRiderCount: number;
  upcomingRideCount: number;
  activeRideCount: number;
  openInvoiceCount: number;
  outstandingBalance: number;
  unreadNotifications: number;
}

export interface RiderGuardianPortalProfileRecord {
  scopeType: "RIDER" | "GUARDIAN";
  id: number;
  code: string | null;
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
  defaultPickupAddress: string | null;
  defaultDropoffAddress: string | null;
  pickupNotes: string | null;
  dropoffNotes: string | null;
  specialInstructions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  preferredCommunicationMethod: "PHONE" | "SMS" | "EMAIL" | null;
  notes: string | null;
  status: string;
  updatedAt: string | null;
}

export interface RiderGuardianPortalProfilePayload {
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  defaultPickupAddress?: string | null;
  defaultDropoffAddress?: string | null;
  pickupNotes?: string | null;
  dropoffNotes?: string | null;
  specialInstructions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  preferredCommunicationMethod?: "PHONE" | "SMS" | "EMAIL" | null;
  notes?: string | null;
}

export interface RiderGuardianPortalLinkedRiderRecord {
  id: number;
  riderCode: string;
  riderDisplayName: string;
  relationshipType: string | null;
  primaryGuardian: boolean;
  authorizedForPickup: boolean;
  billingContact: boolean;
  status: string;
  wheelchairRequired: boolean;
  escortRequired: boolean;
}

export interface RiderGuardianPortalRideRecord {
  id: number;
  rideNumber: string;
  status: string;
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

export interface RiderGuardianPortalInvoiceRecord {
  id: number;
  invoiceNumber: string;
  billToNameSnapshot: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  balanceDue: number;
  currency: string;
  status: string;
}

export interface RiderGuardianPortalPaymentRecord {
  id: number;
  paymentNumber: string;
  invoiceNumber: string | null;
  billToNameSnapshot: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string | null;
  status: string;
}

const basePath = "/portal/rider";

export const riderGuardianPortalApi = {
  async getDashboard() {
    const response = await apiClient.get(`${basePath}/dashboard`);
    return unwrapResponse<RiderGuardianPortalDashboardRecord>(response.data);
  },
  async getProfile() {
    const response = await apiClient.get(`${basePath}/profile`);
    return unwrapResponse<RiderGuardianPortalProfileRecord>(response.data);
  },
  async updateProfile(payload: RiderGuardianPortalProfilePayload) {
    const response = await apiClient.put(`${basePath}/profile`, payload);
    return unwrapResponse<RiderGuardianPortalProfileRecord>(response.data);
  },
  async getLinkedRiders() {
    const response = await apiClient.get(`${basePath}/linked-riders`);
    return unwrapResponse<RiderGuardianPortalLinkedRiderRecord[]>(response.data);
  },
  async searchRides(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/rides`, { params });
    return unwrapResponse<PageResponse<RiderGuardianPortalRideRecord>>(response.data);
  },
  async searchInvoices(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/invoices`, { params });
    return unwrapResponse<PageResponse<RiderGuardianPortalInvoiceRecord>>(response.data);
  },
  async searchPayments(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/payments`, { params });
    return unwrapResponse<PageResponse<RiderGuardianPortalPaymentRecord>>(response.data);
  },
};