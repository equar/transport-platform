package com.transportplatform.tms.features.companydashboard.application;

import com.transportplatform.tms.features.audit.api.response.DashboardActivityResponse;
import java.util.List;

public record CompanyDashboardSummaryResponse(
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long pendingUsers,
        List<DashboardActivityResponse> recentActivity) {
}