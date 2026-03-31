package com.transportplatform.tms.features.saas.api.request;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Set;

public record SubscriptionPlanUpsertRequest(
        @Size(max = 50, message = "Plan code must be 50 characters or fewer.") String planCode,
        @NotBlank(message = "Plan name is required.") @Size(max = 150, message = "Plan name must be 150 characters or fewer.") String name,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        @NotNull(message = "Plan tier is required.") SubscriptionPlanTier tier,
        @NotNull(message = "Monthly price is required.") @DecimalMin(value = "0.00", message = "Monthly price must be zero or greater.") BigDecimal monthlyPrice,
        @NotNull(message = "Annual price is required.") @DecimalMin(value = "0.00", message = "Annual price must be zero or greater.") BigDecimal annualPrice,
        @NotBlank(message = "Currency is required.") @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code.") String currency,
        @NotNull(message = "Max users is required.") @Min(value = 0, message = "Max users must be zero or greater.") Integer maxUsers,
        @NotNull(message = "Max drivers is required.") @Min(value = 0, message = "Max drivers must be zero or greater.") Integer maxDrivers,
        @NotNull(message = "Max vehicles is required.") @Min(value = 0, message = "Max vehicles must be zero or greater.") Integer maxVehicles,
        @NotNull(message = "Max riders is required.") @Min(value = 0, message = "Max riders must be zero or greater.") Integer maxRiders,
        @NotNull(message = "Max organizations is required.") @Min(value = 0, message = "Max organizations must be zero or greater.") Integer maxOrganizations,
        Set<@Size(max = 100, message = "Feature code must be 100 characters or fewer.") String> includedFeatureCodes,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}