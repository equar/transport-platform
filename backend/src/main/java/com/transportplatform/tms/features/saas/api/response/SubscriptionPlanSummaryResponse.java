package com.transportplatform.tms.features.saas.api.response;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import java.math.BigDecimal;
import java.time.Instant;

public record SubscriptionPlanSummaryResponse(
        Long id,
        String planCode,
        String name,
        SubscriptionPlanTier tier,
        BigDecimal monthlyPrice,
        BigDecimal annualPrice,
        String currency,
        int maxUsers,
        int maxDrivers,
        int maxVehicles,
        SubscriptionPlanStatus status,
        Instant createdAt,
        Instant updatedAt) {
}