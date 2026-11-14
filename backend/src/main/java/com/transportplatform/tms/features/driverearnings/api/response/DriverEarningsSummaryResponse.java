package com.transportplatform.tms.features.driverearnings.api.response;

import java.math.BigDecimal;
import java.util.List;

public record DriverEarningsSummaryResponse(
        BigDecimal earnedTotal,
        BigDecimal pendingTotal,
        BigDecimal pendingReviewTotal,
        String currency,
        List<DriverEarningsEntryResponse> entries) {
}
