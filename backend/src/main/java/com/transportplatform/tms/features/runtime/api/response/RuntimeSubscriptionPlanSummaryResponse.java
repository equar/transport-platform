package com.transportplatform.tms.features.runtime.api.response;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import java.math.BigDecimal;
import java.util.Set;

public record RuntimeSubscriptionPlanSummaryResponse(
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
        int maxRiders,
        int maxOrganizations,
        Set<String> includedFeatureCodes,
        String status) {
}