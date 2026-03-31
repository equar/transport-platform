package com.transportplatform.tms.features.companydashboard.application;

import com.transportplatform.tms.features.audit.api.response.DashboardActivityResponse;
import java.util.List;

public record CompanyDashboardSummaryResponse(
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long pendingUsers,
        long totalRiders,
        long activeRiders,
        long suspendedRiders,
        long waitlistedRiders,
        long ridersRequiringWheelchairSupport,
        long ridersRequiringEscort,
        long totalDrivers,
        long activeDrivers,
        long suspendedDrivers,
        long driversPendingReview,
        long driversWithExpiredDocuments,
        long driversMissingRequiredDocuments,
        long totalVehicles,
        long activeVehicles,
        long suspendedVehicles,
        long vehiclesInMaintenance,
        long vehiclesOutOfService,
        long vehiclesWithExpiredDocuments,
        long vehiclesMissingRequiredDocuments,
        List<DashboardActivityResponse> recentActivity) {
}