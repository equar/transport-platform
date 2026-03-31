import { apiClient, unwrapResponse } from "../../../shared/api/client";

export interface DashboardActivity {
  id: number;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  tenantId: string | null;
}

export interface PlatformDashboardSummary {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  recentActivity: DashboardActivity[];
}

export interface CompanyDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  totalRiders: number;
  activeRiders: number;
  suspendedRiders: number;
  waitlistedRiders: number;
  ridersRequiringWheelchairSupport: number;
  ridersRequiringEscort: number;
  totalDrivers: number;
  activeDrivers: number;
  suspendedDrivers: number;
  driversPendingReview: number;
  driversWithExpiredDocuments: number;
  driversMissingRequiredDocuments: number;
  totalVehicles: number;
  activeVehicles: number;
  suspendedVehicles: number;
  vehiclesInMaintenance: number;
  vehiclesOutOfService: number;
  vehiclesWithExpiredDocuments: number;
  vehiclesMissingRequiredDocuments: number;
  recentActivity: DashboardActivity[];
}

export const dashboardApi = {
  async getPlatformSummary() {
    const response = await apiClient.get("/platform/dashboard/summary");
    return unwrapResponse<PlatformDashboardSummary>(response.data);
  },
  async getCompanySummary() {
    const response = await apiClient.get("/company/dashboard/summary");
    return unwrapResponse<CompanyDashboardSummary>(response.data);
  },
};
