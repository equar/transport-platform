import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export interface OrganizationPortalDashboardRecord {
  linkedRiderCount: number;
  activeContractCount: number;
  upcomingRideCount: number;
  openInvoiceCount: number;
  outstandingBalance: number;
  unreadNotifications: number;
}

export interface OrganizationPortalProfileRecord {
  contactId: number;
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  legalName: string | null;
  organizationStatus: string;
  primaryPhone: string | null;
  primaryEmail: string | null;
  website: string | null;
  organizationAddress: string | null;
  billingAddress: string | null;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  preferredCommunicationMethod: "PHONE" | "SMS" | "EMAIL" | null;
  primaryContact: boolean;
  notes: string | null;
  contactStatus: string;
  updatedAt: string | null;
}

export interface OrganizationPortalProfilePayload {
  title?: string | null;
  department?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  preferredCommunicationMethod?: "PHONE" | "SMS" | "EMAIL" | null;
  notes?: string | null;
}

export interface OrganizationPortalContactRecord {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  preferredCommunicationMethod: string | null;
  primary: boolean;
  notes: string | null;
  status: string;
  updatedAt: string | null;
}

export interface OrganizationPortalRiderRecord {
  id: number;
  riderCode: string;
  riderDisplayName: string;
  riderType: string;
  status: string;
  wheelchairRequired: boolean;
  escortRequired: boolean;
}

export interface OrganizationPortalRideRecord {
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

export interface OrganizationPortalContractRecord {
  id: number;
  contractCode: string;
  contractName: string;
  contractType: string;
  billingModel: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

export interface OrganizationPortalInvoiceRecord {
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

export interface OrganizationPortalPaymentRecord {
  id: number;
  paymentNumber: string;
  invoiceNumber: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string | null;
  status: string;
}

const basePath = "/portal/organization";

export const organizationPortalApi = {
  async getDashboard() {
    const response = await apiClient.get(`${basePath}/dashboard`);
    return unwrapResponse<OrganizationPortalDashboardRecord>(response.data);
  },
  async getProfile() {
    const response = await apiClient.get(`${basePath}/profile`);
    return unwrapResponse<OrganizationPortalProfileRecord>(response.data);
  },
  async updateProfile(payload: OrganizationPortalProfilePayload) {
    const response = await apiClient.put(`${basePath}/profile`, payload);
    return unwrapResponse<OrganizationPortalProfileRecord>(response.data);
  },
  async getContacts() {
    const response = await apiClient.get(`${basePath}/contacts`);
    return unwrapResponse<OrganizationPortalContactRecord[]>(response.data);
  },
  async searchRiders(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/riders`, { params });
    return unwrapResponse<PageResponse<OrganizationPortalRiderRecord>>(response.data);
  },
  async searchRides(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/rides`, { params });
    return unwrapResponse<PageResponse<OrganizationPortalRideRecord>>(response.data);
  },
  async searchContracts(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/contracts`, { params });
    return unwrapResponse<PageResponse<OrganizationPortalContractRecord>>(response.data);
  },
  async searchInvoices(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/invoices`, { params });
    return unwrapResponse<PageResponse<OrganizationPortalInvoiceRecord>>(response.data);
  },
  async searchPayments(params: Record<string, unknown>) {
    const response = await apiClient.get(`${basePath}/payments`, { params });
    return unwrapResponse<PageResponse<OrganizationPortalPaymentRecord>>(response.data);
  },
};