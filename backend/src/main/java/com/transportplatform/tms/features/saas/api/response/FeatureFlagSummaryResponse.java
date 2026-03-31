package com.transportplatform.tms.features.saas.api.response;

import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import java.time.Instant;

public record FeatureFlagSummaryResponse(
        Long id,
        String flagCode,
        String name,
        String moduleKey,
        boolean enabledByDefault,
        boolean platformManagedOnly,
        FeatureFlagStatus status,
        long overrideCount,
        Instant updatedAt) {
}