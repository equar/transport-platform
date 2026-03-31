package com.transportplatform.tms.features.platform.application;

import com.transportplatform.tms.features.audit.api.response.DashboardActivityResponse;
import java.util.List;

public record PlatformDashboardSummaryResponse(
        long totalTenants,
        long activeTenants,
        long suspendedTenants,
        long pendingApplications,
        long approvedApplications,
        long rejectedApplications,
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long pendingUsers,
        List<DashboardActivityResponse> recentActivity) {
}
