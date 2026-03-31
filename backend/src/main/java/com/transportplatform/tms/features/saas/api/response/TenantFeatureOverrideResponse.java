package com.transportplatform.tms.features.saas.api.response;

import java.time.Instant;

public record TenantFeatureOverrideResponse(
        Long id,
        String tenantId,
        Long featureFlagId,
        String flagCode,
        boolean enabled,
        String notes,
        String updatedBy,
        Instant updatedAt) {
}