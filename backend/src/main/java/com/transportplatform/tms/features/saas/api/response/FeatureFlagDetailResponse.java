package com.transportplatform.tms.features.saas.api.response;

import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import java.time.Instant;

public record FeatureFlagDetailResponse(
        Long id,
        String flagCode,
        String name,
        String description,
        String moduleKey,
        boolean enabledByDefault,
        boolean platformManagedOnly,
        String notes,
        FeatureFlagStatus status,
        long overrideCount,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}