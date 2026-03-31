package com.transportplatform.tms.features.driverportal.api.response;

public record DriverPortalDashboardResponse(
        long ridesToday,
        long assignedRides,
        long activeRoutesToday,
        long unresolvedComplianceIssues,
        long expiringDocumentsSoon,
        long unreadNotifications) {
}