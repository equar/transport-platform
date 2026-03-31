package com.transportplatform.tms.features.riderguardianportal.api.response;

import java.math.BigDecimal;

public record RiderGuardianPortalDashboardResponse(
        String scopeType,
        long linkedRiderCount,
        long upcomingRideCount,
        long activeRideCount,
        long openInvoiceCount,
        BigDecimal outstandingBalance,
        long unreadNotifications) {
}