package com.transportplatform.tms.features.saas.api.response;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

public record SubscriptionPlanDetailResponse(
        Long id,
        String planCode,
        String name,
        String description,
        SubscriptionPlanTier tier,
        BigDecimal monthlyPrice,
        BigDecimal annualPrice,
        String currency,
        int maxUsers,
        int maxDrivers,
        int maxVehicles,
        int maxRiders,
        int maxOrganizations,
        Set<String> includedFeatureCodes,
        String notes,
        SubscriptionPlanStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}