package com.transportplatform.tms.features.saas.api.response;

import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import java.time.Instant;
import java.time.LocalDate;

public record TenantSubscriptionSummaryResponse(
        Long id,
        String tenantId,
        String tenantCode,
        String tenantName,
        Long subscriptionPlanId,
        String planCode,
        String planName,
        SubscriptionPlanTier planTier,
        TenantSubscriptionStatus status,
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        LocalDate renewalDate,
        boolean trial,
        LocalDate trialEndDate,
        Instant updatedAt) {
}