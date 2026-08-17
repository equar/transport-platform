import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type RideStatus =
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

export type RideTripType = "ONE_WAY" | "ROUND_TRIP";
export type RidePriorityLevel = "LOW" | "STANDARD" | "HIGH" | "URGENT";
export type RideBillingType =
  | "CONTRACT"
  | "PRIVATE_PAY"
  | "SPONSORED"
  | "INTERNAL"
  | "OTHER";
export type ServiceType =
  | "GENERAL_TRANSPORT"
  | "SCHOOL_TRANSPORT"
  | "NEMT"
  | "DIALYSIS"
  | "EMPLOYER_COMMUTER"
  | "ADA_PARATRANSIT"
  | "SHUTTLE"
  | "OTHER";
export type RideRecurrencePatternType = "DAILY" | "WEEKLY" | "CUSTOM";
export type RideRecurrenceStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "INACTIVE"
  | "COMPLETED";
export type RideDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface RideRecord {
  id: number;
  tenantId: string;
  rideNumber: string;
  riderId: number;
  riderCode: string;
  riderName: string;
  guardianId: number | null;
  guardianName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  contractId: number | null;
  contractCode: string | null;
  contractName: string | null;
  serviceAreaId: number | null;
  serviceAreaName: string | null;
  serviceType: ServiceType;
  tripType: RideTripType;
  pickupAddressLine1: string;
  pickupAddressLine2: string | null;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffAddressLine2: string | null;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupAt: string;
  scheduledDropoffAt: string | null;
  returnPickupAt: string | null;
  returnDropoffAt: string | null;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  companionCount: number;
  specialInstructions: string | null;
  internalNotes: string | null;
  operationalNotes: string | null;
  priorityLevel: RidePriorityLevel | null;
  billingType: RideBillingType | null;
  driverId: number | null;
  vehicleId: number | null;
  routeId: number | null;
  recurrenceScheduleId: number | null;
  recurrenceCode: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  status: RideStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RecurringRideScheduleRecord {
  id: number;
  tenantId: string;
  recurrenceCode: string;
  riderId: number;
  riderCode: string;
  riderName: string;
  guardianId: number | null;
  guardianName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  contractId: number | null;
  contractCode: string | null;
  contractName: string | null;
  serviceAreaId: number | null;
  serviceAreaName: string | null;
  serviceType: ServiceType;
  tripType: RideTripType;
  pickupAddressLine1: string;
  pickupAddressLine2: string | null;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffAddressLine2: string | null;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupTime: string;
  scheduledDropoffTime: string | null;
  returnPickupTime: string | null;
  returnDropoffTime: string | null;
  recurrencePatternType: RideRecurrencePatternType;
  daysOfWeek: RideDayOfWeek[];
  intervalDays: number | null;
  startDate: string;
  endDate: string | null;
  occurrenceLimit: number | null;
  skipDates: string[];
  wheelchairRequired: boolean;
  escortRequired: boolean;
  companionCount: number;
  specialInstructions: string | null;
  internalNotes: string | null;
  billingType: RideBillingType | null;
  status: RideRecurrenceStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  generatedRideCount: number;
}

export interface RidePayload {
  riderId: number | null;
  guardianId?: number | null;
  organizationId?: number | null;
  contractId?: number | null;
  serviceAreaId?: number | null;
  serviceType: ServiceType;
  tripType: RideTripType;
  pickupAddressLine1: string;
  pickupAddressLine2?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffAddressLine2?: string | null;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupAt: string;
  scheduledDropoffAt?: string | null;
  returnPickupAt?: string | null;
  returnDropoffAt?: string | null;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  companionCount: number;
  specialInstructions?: string | null;
  internalNotes?: string | null;
  operationalNotes?: string | null;
  priorityLevel?: RidePriorityLevel | null;
  billingType?: RideBillingType | null;
  status?: Extract<
    RideStatus,
    "DRAFT" | "REQUESTED" | "PENDING_REVIEW" | "SCHEDULED"
  > | null;
}

export interface RecurringRideSchedulePayload {
  riderId: number | null;
  guardianId?: number | null;
  organizationId?: number | null;
  contractId?: number | null;
  serviceAreaId?: number | null;
  serviceType: ServiceType;
  tripType: RideTripType;
  pickupAddressLine1: string;
  pickupAddressLine2?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffAddressLine2?: string | null;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupTime: string;
  scheduledDropoffTime?: string | null;
  returnPickupTime?: string | null;
  returnDropoffTime?: string | null;
  recurrencePatternType: RideRecurrencePatternType;
  daysOfWeek: RideDayOfWeek[];
  intervalDays?: number | null;
  startDate: string;
  endDate?: string | null;
  occurrenceLimit?: number | null;
  skipDates: string[];
  wheelchairRequired: boolean;
  escortRequired: boolean;
  companionCount: number;
  specialInstructions?: string | null;
  internalNotes?: string | null;
  billingType?: RideBillingType | null;
  status?: Extract<RideRecurrenceStatus, "DRAFT" | "ACTIVE"> | null;
}

export interface RideSearchParams {
  keyword: string;
  status: RideStatus | "";
  serviceType: ServiceType | "";
  tripType: RideTripType | "";
  riderId: number | null;
  organizationId: number | null;
  contractId: number | null;
  fromDate: string;
  toDate: string;
  recurringOnly: "" | "true" | "false";
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface RecurringRideSearchParams {
  keyword: string;
  status: RideRecurrenceStatus | "";
  serviceType: ServiceType | "";
  tripType: RideTripType | "";
  recurrencePatternType: RideRecurrencePatternType | "";
  riderId: number | null;
  organizationId: number | null;
  contractId: number | null;
  fromDate: string;
  toDate: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface LookupOption {
  id: number;
  label: string;
  code?: string | null;
  relatedOrganizationId?: number | null;
}

export interface RideGenerationResult {
  createdCount: number;
  duplicateCount: number;
  skippedCount: number;
  summary: string;
}

export type RideEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "DRIVER_ASSIGNED"
  | "DRIVER_UNASSIGNED"
  | "VEHICLE_ASSIGNED"
  | "VEHICLE_UNASSIGNED"
  | "ROUTE_ASSIGNED"
  | "ROUTE_UNASSIGNED"
  | "DRIVER_EN_ROUTE"
  | "ARRIVED"
  | "PICKED_UP"
  | "DROPPED_OFF"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "MISSED"
  | "FAILED"
  | "NOTE_ADDED";

export interface RideEventRecord {
  id: number;
  rideId: number;
  eventType: RideEventType;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  previousStatus: RideStatus | null;
  newStatus: RideStatus | null;
  notes: string | null;
  createdAt: string;
}

export interface RideLocationSnapshotRecord {
  id: number;
  rideId: number;
  driverId: number;
  vehicleId: number | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
  capturedAt: string;
  createdAt: string;
  createdBy: string;
}

export const rideStatusOptions: RideStatus[] = [
  "DRAFT",
  "REQUESTED",
  "PENDING_REVIEW",
  "SCHEDULED",
  "ASSIGNED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "RIDER_NO_SHOW",
  "PICKED_UP",
  "DROPPED_OFF",
  "COMPLETED",
  "CANCELLED",
  "MISSED",
  "FAILED",
];

export const rideCreateStatusOptions: Array<
  Extract<RideStatus, "DRAFT" | "REQUESTED" | "PENDING_REVIEW" | "SCHEDULED">
> = ["DRAFT", "REQUESTED", "PENDING_REVIEW", "SCHEDULED"];

export const serviceTypeOptions: ServiceType[] = [
  "GENERAL_TRANSPORT",
  "SCHOOL_TRANSPORT",
  "NEMT",
  "DIALYSIS",
  "EMPLOYER_COMMUTER",
  "ADA_PARATRANSIT",
  "SHUTTLE",
  "OTHER",
];

export const rideTripTypeOptions: RideTripType[] = ["ONE_WAY", "ROUND_TRIP"];
export const ridePriorityOptions: RidePriorityLevel[] = [
  "LOW",
  "STANDARD",
  "HIGH",
  "URGENT",
];
export const rideBillingTypeOptions: RideBillingType[] = [
  "CONTRACT",
  "PRIVATE_PAY",
  "SPONSORED",
  "INTERNAL",
  "OTHER",
];
export const recurringRideStatusOptions: RideRecurrenceStatus[] = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "INACTIVE",
  "COMPLETED",
];
export const recurringRideCreateStatusOptions: Array<
  Extract<RideRecurrenceStatus, "DRAFT" | "ACTIVE">
> = ["DRAFT", "ACTIVE"];
export const recurrencePatternOptions: RideRecurrencePatternType[] = [
  "DAILY",
  "WEEKLY",
  "CUSTOM",
];
export const dayOfWeekOptions: RideDayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const ridesApi = {
  async search(params: RideSearchParams) {
    const response = await apiClient.get("/company/rides", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        serviceType: params.serviceType || undefined,
        tripType: params.tripType || undefined,
        riderId: params.riderId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        contractId: params.contractId ?? undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        recurringOnly:
          params.recurringOnly === ""
            ? undefined
            : params.recurringOnly === "true",
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<RideRecord>>(response.data);
  },
  async getById(rideId: number) {
    const response = await apiClient.get(`/company/rides/${rideId}`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async getLocationSnapshot(rideId: number) {
    const response = await apiClient.get(`/company/rides/${rideId}/location-snapshot`);
    return unwrapResponse<RideLocationSnapshotRecord | null>(response.data);
  },
  async create(payload: RidePayload) {
    const response = await apiClient.post("/company/rides", payload);
    return unwrapResponse<RideRecord>(response.data);
  },
  async update(rideId: number, payload: RidePayload) {
    const response = await apiClient.put(`/company/rides/${rideId}`, payload);
    return unwrapResponse<RideRecord>(response.data);
  },
  async request(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/request`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async review(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/review`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async schedule(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/schedule`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markAssigned(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/mark-assigned`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markDriverEnRoute(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/driver-en-route`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markArrived(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/arrived`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markPickedUp(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/picked-up`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markDroppedOff(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/dropped-off`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async complete(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/complete`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markNoShow(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/no-show`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markMissed(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/missed`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async markFailed(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/failed`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async cancel(rideId: number, reason: string) {
    const response = await apiClient.post(`/company/rides/${rideId}/cancel`, {
      reason,
    });
    return unwrapResponse<RideRecord>(response.data);
  },
  async getEvents(rideId: number) {
    const response = await apiClient.get(`/company/rides/${rideId}/events`);
    return unwrapResponse<RideEventRecord[]>(response.data);
  },
  async addEventNote(rideId: number, notes: string) {
    const response = await apiClient.post(`/company/rides/${rideId}/events/notes`, { notes });
    return unwrapResponse<RideRecord>(response.data);
  },
  async searchRecurring(params: RecurringRideSearchParams) {
    const response = await apiClient.get("/company/recurring-rides", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        serviceType: params.serviceType || undefined,
        tripType: params.tripType || undefined,
        recurrencePatternType: params.recurrencePatternType || undefined,
        riderId: params.riderId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        contractId: params.contractId ?? undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<RecurringRideScheduleRecord>>(response.data);
  },
  async getRecurringById(recurrenceId: number) {
    const response = await apiClient.get(`/company/recurring-rides/${recurrenceId}`);
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async createRecurring(payload: RecurringRideSchedulePayload) {
    const response = await apiClient.post("/company/recurring-rides", payload);
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async updateRecurring(
    recurrenceId: number,
    payload: RecurringRideSchedulePayload,
  ) {
    const response = await apiClient.put(
      `/company/recurring-rides/${recurrenceId}`,
      payload,
    );
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async activateRecurring(recurrenceId: number) {
    const response = await apiClient.post(
      `/company/recurring-rides/${recurrenceId}/activate`,
    );
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async pauseRecurring(recurrenceId: number) {
    const response = await apiClient.post(
      `/company/recurring-rides/${recurrenceId}/pause`,
    );
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async deactivateRecurring(recurrenceId: number) {
    const response = await apiClient.post(
      `/company/recurring-rides/${recurrenceId}/deactivate`,
    );
    return unwrapResponse<RecurringRideScheduleRecord>(response.data);
  },
  async generateRecurring(
    recurrenceId: number,
    payload: { fromDate: string; toDate: string },
  ) {
    const response = await apiClient.post(
      `/company/recurring-rides/${recurrenceId}/generate`,
      payload,
    );
    return unwrapResponse<RideGenerationResult>(response.data);
  },
  async listRiderOptions() {
    const response = await apiClient.get("/company/riders", {
      params: {
        keyword: "",
        status: "ACTIVE",
        page: 0,
        size: 100,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<
      { id: number; riderCode: string; firstName: string; lastName: string }
    >>(response.data);
    return page.items.map((item) => ({
      id: item.id,
      code: item.riderCode,
      label: `${item.firstName} ${item.lastName}`.trim(),
    }));
  },
  async listGuardianOptionsForRider(riderId: number) {
    const response = await apiClient.get(`/company/riders/${riderId}`);
    const rider = unwrapResponse<{
      guardians: Array<{
        guardianId: number;
        guardianFirstName: string;
        guardianLastName: string;
      }>;
    }>(response.data);
    return rider.guardians.map((item) => ({
      id: item.guardianId,
      label: `${item.guardianFirstName} ${item.guardianLastName}`.trim(),
    }));
  },
  async listOrganizationOptions() {
    const response = await apiClient.get("/company/organizations/options");
    const items = unwrapResponse<Array<{ id: number; organizationCode: string; name: string }>>(
      response.data,
    );
    return items.map((item) => ({
      id: item.id,
      code: item.organizationCode,
      label: item.name,
    }));
  },
  async listContractOptions() {
    const response = await apiClient.get("/company/contracts", {
      params: {
        keyword: "",
        status: "ACTIVE",
        page: 0,
        size: 100,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<{
      id: number;
      contractCode: string;
      contractName: string;
      organizationId: number;
    }>>(response.data);
    return page.items.map((item) => ({
      id: item.id,
      code: item.contractCode,
      label: item.contractName,
      relatedOrganizationId: item.organizationId,
    }));
  },
  async listServiceAreaOptions() {
    const response = await apiClient.get("/company/service-areas", {
      params: {
        keyword: "",
        status: "ACTIVE",
        page: 0,
        size: 100,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<{ id: number; areaCode: string; name: string }>>(
      response.data,
    );
    return page.items.map((item) => ({
      id: item.id,
      code: item.areaCode,
      label: item.name,
    }));
  },
};
