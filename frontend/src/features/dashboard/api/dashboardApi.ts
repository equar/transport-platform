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
  activeSubscriptions: number;
  trialSubscriptions: number;
  suspendedSubscriptions: number;
  activeSubscriptionPlans: number;
  activeFeatureFlags: number;
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
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalContracts: number;
  activeContracts: number;
  expiringContractsSoon: number;
  totalServiceAreas: number;
  activeServiceAreas: number;
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
  totalRides: number;
  requestedRides: number;
  scheduledRides: number;
  assignedRides: number;
  ridesInProgress: number;
  rideExceptions: number;
  cancelledRides: number;
  completedRides: number;
  totalRoutes: number;
  readyRoutes: number;
  routesInProgress: number;
  totalRecurringRideSchedules: number;
  activeRecurringRideSchedules: number;
  totalInvoices: number;
  draftInvoices: number;
  issuedInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  totalPaymentsRecorded: number;
  partiallyPaidInvoices: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  outstandingBalance: number;
  overdueAmount: number;
  currentReceivablesAmount: number;
  aging1To30Amount: number;
  aging31To60Amount: number;
  aging61To90Amount: number;
  aging90PlusAmount: number;
  unreadNotifications: number;
  openComplianceIssues: number;
  criticalComplianceIssues: number;
  documentsExpiringSoon: number;
  openIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  availableReportsCount: number;
  settingsProfileCompletenessPercent: number;
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
