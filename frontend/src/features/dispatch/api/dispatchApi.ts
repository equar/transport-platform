import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";
import type { DriverRecord } from "../../drivers/api/driversApi";
import type { RideRecord, RideStatus, ServiceType } from "../../rides/api/ridesApi";
import type { VehicleRecord } from "../../vehicles/api/vehiclesApi";

export type DispatchRideView = "ALL" | "UNASSIGNED" | "ASSIGNED" | "EXCEPTIONS";

export interface DispatchRideRecord {
  rideId: number;
  rideNumber: string;
  riderId: number;
  riderCode: string;
  riderName: string;
  organizationId: number | null;
  organizationName: string | null;
  serviceType: ServiceType;
  status: RideStatus;
  scheduledPickupAt: string;
  scheduledDropoffAt: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  driverId: number | null;
  driverCode: string | null;
  driverName: string | null;
  vehicleId: number | null;
  vehicleCode: string | null;
  vehicleDisplayName: string | null;
  routeId: number | null;
  complianceWarning: boolean;
  conflictWarning: boolean;
  warningMessages: string[];
  updatedAt: string;
}

export interface DispatchBoardSummary {
  scheduledCount: number;
  assignedCount: number;
  inProgressCount: number;
  exceptionCount: number;
  completedTodayCount: number;
  noShowTodayCount: number;
}

export interface DispatchSearchParams {
  keyword: string;
  view: DispatchRideView;
  status: RideStatus | "";
  serviceType: ServiceType | "";
  driverId: number | null;
  vehicleId: number | null;
  organizationId: number | null;
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
}

export const dispatchViewOptions: DispatchRideView[] = [
  "ALL",
  "UNASSIGNED",
  "ASSIGNED",
  "EXCEPTIONS",
];

export const dispatchApi = {
  async search(params: DispatchSearchParams) {
    const response = await apiClient.get("/company/dispatch/rides", {
      params: {
        keyword: params.keyword,
        view: params.view,
        status: params.status || undefined,
        serviceType: params.serviceType || undefined,
        driverId: params.driverId ?? undefined,
        vehicleId: params.vehicleId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<DispatchRideRecord>>(response.data);
  },
  async getSummary(params: Omit<DispatchSearchParams, "view" | "page" | "size" | "sortBy" | "sortDirection">) {
    const response = await apiClient.get("/company/dispatch/summary", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        serviceType: params.serviceType || undefined,
        driverId: params.driverId ?? undefined,
        vehicleId: params.vehicleId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
      },
    });
    return unwrapResponse<DispatchBoardSummary>(response.data);
  },
  async assignDriver(rideId: number, driverId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/assign-driver`, { driverId });
    return unwrapResponse<RideRecord>(response.data);
  },
  async assignVehicle(rideId: number, vehicleId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/assign-vehicle`, { vehicleId });
    return unwrapResponse<RideRecord>(response.data);
  },
  async assignResources(rideId: number, payload: { driverId?: number | null; vehicleId?: number | null }) {
    const response = await apiClient.post(`/company/rides/${rideId}/assign-resources`, payload);
    return unwrapResponse<RideRecord>(response.data);
  },
  async unassignDriver(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/unassign-driver`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async unassignVehicle(rideId: number) {
    const response = await apiClient.post(`/company/rides/${rideId}/unassign-vehicle`);
    return unwrapResponse<RideRecord>(response.data);
  },
  async listDriverOptions() {
    const response = await apiClient.get("/company/drivers", {
      params: {
        keyword: "",
        status: "ACTIVE",
        page: 0,
        size: 100,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<DriverRecord>>(response.data);
    return page.items
      .filter((item) => item.complianceSummary.overallStatus === "COMPLIANT")
      .map((item) => ({
        id: item.id,
        code: item.driverCode,
        label: `${item.firstName} ${item.lastName}`.trim(),
      } satisfies LookupOption));
  },
  async listVehicleOptions() {
    const response = await apiClient.get("/company/vehicles", {
      params: {
        keyword: "",
        status: "ACTIVE",
        page: 0,
        size: 100,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      },
    });
    const page = unwrapResponse<PageResponse<VehicleRecord>>(response.data);
    return page.items
      .filter((item) => item.complianceSummary.overallStatus === "COMPLIANT")
      .map((item) => ({
        id: item.id,
        code: item.vehicleCode,
        label: `${item.plateNumber} - ${item.make} ${item.model}`,
      } satisfies LookupOption));
  },
};