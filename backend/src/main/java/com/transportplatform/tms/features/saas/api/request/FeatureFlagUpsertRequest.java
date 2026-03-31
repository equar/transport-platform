package com.transportplatform.tms.features.saas.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeatureFlagUpsertRequest(
        @Size(max = 50, message = "Flag code must be 50 characters or fewer.") String flagCode,
        @NotBlank(message = "Feature flag name is required.") @Size(max = 150, message = "Feature flag name must be 150 characters or fewer.") String name,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        @NotBlank(message = "Module key is required.") @Size(max = 80, message = "Module key must be 80 characters or fewer.") String moduleKey,
        @NotNull(message = "Enabled by default flag is required.") Boolean enabledByDefault,
        @NotNull(message = "Platform-managed-only flag is required.") Boolean platformManagedOnly,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}