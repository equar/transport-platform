package com.transportplatform.tms.features.saas.api.request;

import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TenantSubscriptionUpsertRequest(
        @NotBlank(message = "Tenant ID is required.") @Size(max = 36, message = "Tenant ID must be 36 characters or fewer.") String tenantId,
        @NotNull(message = "Subscription plan is required.") Long subscriptionPlanId,
        @NotNull(message = "Effective start date is required.") LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        LocalDate renewalDate,
        @NotNull(message = "Trial flag is required.") Boolean isTrial,
        LocalDate trialEndDate,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes,
        @NotNull(message = "Subscription status is required.") TenantSubscriptionStatus status) {
}