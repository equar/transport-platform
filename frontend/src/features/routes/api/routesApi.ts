import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";
import type { ServiceType } from "../../rides/api/ridesApi";

export type RouteStatus = "DRAFT" | "PLANNED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type RouteStopStatus = "PLANNED" | "ARRIVED" | "PICKED_UP" | "DROPPED_OFF" | "SKIPPED" | "CANCELLED";

export interface RouteStopRecord {
  id: number;
  rideId: number;
  rideNumber: string;
  riderName: string;
  organizationName: string | null;
  stopSequence: number;
  plannedPickupAt: string | null;
  plannedDropoffAt: string | null;
  pickupSummary: string;
  dropoffSummary: string;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  rideStatus: string;
  notes: string | null;
  status: RouteStopStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RouteRecord {
  id: number;
  tenantId?: string;
  routeCode: string;
  routeName: string;
  routeDate: string;
  serviceType: ServiceType;
  assignedDriverId: number | null;
  assignedDriverName: string | null;
  assignedVehicleId: number | null;
  assignedVehicleSummary: string | null;
  startTime: string | null;
  endTime: string | null;
  manifestNotes: string | null;
  notes: string | null;
  status: RouteStatus;
  linkedRideCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  stops?: RouteStopRecord[];
}

export interface RouteSearchParams {
  keyword: string;
  status: RouteStatus | "";
  serviceType: ServiceType | "";
  fromDate: string;
  toDate: string;
  driverId: number | null;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

export interface RoutePayload {
  routeName: string;
  routeDate: string;
  serviceType: ServiceType;
  startTime?: string | null;
  endTime?: string | null;
  manifestNotes?: string | null;
  notes?: string | null;
  status?: Extract<RouteStatus, "DRAFT" | "PLANNED"> | null;
}

export interface AddRouteStopPayload {
  rideId: number;
  stopSequence?: number | null;
  plannedPickupAt?: string | null;
  plannedDropoffAt?: string | null;
  notes?: string | null;
}

export interface RouteReorderItem {
  routeStopId: number;
  stopSequence: number;
}

export const routeStatusOptions: RouteStatus[] = [
  "DRAFT",
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const routesApi = {
  async search(params: RouteSearchParams) {
    const response = await apiClient.get("/company/routes", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        serviceType: params.serviceType || undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        driverId: params.driverId ?? undefined,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
      },
    });
    return unwrapResponse<PageResponse<RouteRecord>>(response.data);
  },
  async getById(routeId: number) {
    const response = await apiClient.get(`/company/routes/${routeId}`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async create(payload: RoutePayload) {
    const response = await apiClient.post("/company/routes", payload);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async update(routeId: number, payload: RoutePayload) {
    const response = await apiClient.put(`/company/routes/${routeId}`, payload);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async assignResources(routeId: number, payload: { driverId?: number | null; vehicleId?: number | null }) {
    const response = await apiClient.post(`/company/routes/${routeId}/assign-resources`, payload);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async unassignDriver(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/unassign-driver`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async unassignVehicle(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/unassign-vehicle`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async markReady(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/ready`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async start(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/start`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async complete(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/complete`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async cancel(routeId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/cancel`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async addStop(routeId: number, payload: AddRouteStopPayload) {
    const response = await apiClient.post(`/company/routes/${routeId}/stops`, payload);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async removeStop(routeId: number, routeStopId: number) {
    const response = await apiClient.post(`/company/routes/${routeId}/stops/${routeStopId}/remove`);
    return unwrapResponse<RouteRecord>(response.data);
  },
  async reorderStops(routeId: number, items: RouteReorderItem[]) {
    const response = await apiClient.post(`/company/routes/${routeId}/stops/reorder`, { items });
    return unwrapResponse<RouteRecord>(response.data);
  },
};