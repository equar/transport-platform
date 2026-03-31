package com.transportplatform.tms.features.runtime.api.response;

public record RuntimeFeatureFlagResponse(
        Long id,
        String flagCode,
        String name,
        String moduleKey,
        boolean enabled,
        boolean tenantOverrideApplied,
        String overrideNotes) {
}