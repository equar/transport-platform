package com.transportplatform.tms.features.saas.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TenantFeatureOverrideUpsertRequest(
        @NotBlank(message = "Tenant ID is required.") @Size(max = 36, message = "Tenant ID must be 36 characters or fewer.") String tenantId,
        @NotNull(message = "Enabled flag is required.") Boolean enabled,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}