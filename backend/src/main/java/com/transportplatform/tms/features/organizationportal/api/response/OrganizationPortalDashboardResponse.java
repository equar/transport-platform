package com.transportplatform.tms.features.organizationportal.api.response;

import java.math.BigDecimal;

public record OrganizationPortalDashboardResponse(
        long linkedRiderCount,
        long activeContractCount,
        long upcomingRideCount,
        long openInvoiceCount,
        BigDecimal outstandingBalance,
        long unreadNotifications) {
}