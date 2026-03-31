package com.transportplatform.tms.features.runtime.api.response;

import java.time.LocalDate;

public record RuntimeTenantSubscriptionSummaryResponse(
        Long id,
        String status,
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        LocalDate renewalDate,
        boolean trial,
        LocalDate trialEndDate,
        String notes) {
}