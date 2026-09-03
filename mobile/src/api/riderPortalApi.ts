import { apiClient, unwrapResponse } from './client';
import type { PageResponse } from './types';
import type { DriverLocationSnapshotPayload } from './driverPortalApi';

export interface RiderPortalDashboardRecord {
  scopeType: 'RIDER' | 'GUARDIAN';
  linkedRiderCount: number;
  upcomingRideCount: number;
  activeRideCount: number;
  openInvoiceCount: number;
  outstandingBalance: number;
  unreadNotifications: number;
}

export interface RiderPortalProfileRecord {
  scopeType: 'RIDER' | 'GUARDIAN';
  id: number;
  code: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  defaultPickupAddress: string | null;
  defaultDropoffAddress: string | null;
  specialInstructions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  preferredCommunicationMethod: 'PHONE' | 'SMS' | 'EMAIL' | null;
  status: string;
  updatedAt: string | null;
}

export interface RiderPortalProfilePayload {
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  defaultPickupAddress?: string | null;
  defaultDropoffAddress?: string | null;
  specialInstructions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface LinkedRiderRecord {
  id: number;
  riderCode: string;
  riderDisplayName: string;
  relationshipType: string | null;
  primaryGuardian: boolean;
  authorizedForPickup: boolean;
  status: string;
  wheelchairRequired: boolean;
  escortRequired: boolean;
}

export interface RiderPortalRideRecord {
  id: number;
  rideNumber: string;
  status: string;
  serviceType: string;
  tripType: string;
  scheduledPickupAt: string;
  scheduledDropoffAt: string | null;
  riderName: string;
  guardianName: string | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
}

export interface RiderPortalRideDetailRecord extends RiderPortalRideRecord {
  recurringRide: boolean;
  wheelchairRequired?: boolean;
  escortRequired?: boolean;
  companionCount?: number;
  specialInstructions?: string | null;
}

export interface RiderPortalRideCreatePayload {
  riderId?: number;
  guardianId?: number;
  serviceType:
    | 'GENERAL_TRANSPORT'
    | 'SCHOOL_TRANSPORT'
    | 'NEMT'
    | 'DIALYSIS'
    | 'EMPLOYER_COMMUTER'
    | 'ADA_PARATRANSIT'
    | 'SHUTTLE'
    | 'OTHER';
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  pickupAddressLine1: string;
  pickupAddressLine2?: string;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffAddressLine2?: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupAt: string;
  scheduledDropoffAt?: string;
  returnPickupAt?: string;
  returnDropoffAt?: string;
  wheelchairRequired?: boolean;
  escortRequired?: boolean;
  companionCount?: number;
  specialInstructions?: string;
}

export interface RiderRideLocationSnapshotRecord extends DriverLocationSnapshotPayload {
  id: number;
  rideId: number;
  driverId: number;
  vehicleId: number | null;
  capturedAt: string;
  createdAt: string;
  createdBy: string;
}

export interface RiderPortalInvoiceRecord {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  balanceDue: number;
  currency: string;
  status: string;
}

export interface RiderPortalPaymentRecord {
  id: number;
  paymentNumber: string;
  invoiceNumber: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string | null;
  status: string;
}

const base = '/portal/rider';

export const riderPortalApi = {
  async getDashboard() {
    const r = await apiClient.get(`${base}/dashboard`);
    return unwrapResponse<RiderPortalDashboardRecord>(r.data);
  },
  async getProfile() {
    const r = await apiClient.get(`${base}/profile`);
    return unwrapResponse<RiderPortalProfileRecord>(r.data);
  },
  async updateProfile(payload: RiderPortalProfilePayload) {
    const r = await apiClient.put(`${base}/profile`, payload);
    return unwrapResponse<RiderPortalProfileRecord>(r.data);
  },
  async getLinkedRiders() {
    const r = await apiClient.get(`${base}/linked-riders`);
    return unwrapResponse<LinkedRiderRecord[]>(r.data);
  },
  async searchRides(params?: Record<string, unknown>) {
    const r = await apiClient.get(`${base}/rides`, { params });
    return unwrapResponse<PageResponse<RiderPortalRideRecord>>(r.data);
  },
  async getRide(rideId: number) {
    const r = await apiClient.get(`${base}/rides/${rideId}`);
    return unwrapResponse<RiderPortalRideDetailRecord>(r.data);
  },
  async createRide(payload: RiderPortalRideCreatePayload) {
    const r = await apiClient.post(`${base}/rides`, payload);
    return unwrapResponse<RiderPortalRideDetailRecord>(r.data);
  },
  async getRideLocationSnapshot(rideId: number) {
    const r = await apiClient.get(`${base}/rides/${rideId}/location-snapshot`);
    return unwrapResponse<RiderRideLocationSnapshotRecord | null>(r.data);
  },
  async cancelRide(rideId: number, reason?: string) {
    const r = await apiClient.post(`${base}/rides/${rideId}/cancel`, { reason });
    return unwrapResponse<RiderPortalRideDetailRecord>(r.data);
  },
  async searchInvoices(params?: Record<string, unknown>) {
    const r = await apiClient.get(`${base}/invoices`, { params });
    return unwrapResponse<PageResponse<RiderPortalInvoiceRecord>>(r.data);
  },
  async searchPayments(params?: Record<string, unknown>) {
    const r = await apiClient.get(`${base}/payments`, { params });
    return unwrapResponse<PageResponse<RiderPortalPaymentRecord>>(r.data);
  },
};
