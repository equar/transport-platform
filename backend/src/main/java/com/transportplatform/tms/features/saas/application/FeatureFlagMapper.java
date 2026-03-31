package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.api.request.FeatureFlagUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagDetailResponse;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagSummaryResponse;
import com.transportplatform.tms.features.saas.api.response.TenantFeatureOverrideResponse;
import com.transportplatform.tms.features.saas.domain.FeatureFlag;
import com.transportplatform.tms.features.saas.domain.TenantFeatureOverride;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagMapper {

    public void apply(FeatureFlag featureFlag, FeatureFlagUpsertRequest request) {
        featureFlag.setName(request.name().trim());
        featureFlag.setDescription(trimToNull(request.description()));
        featureFlag.setModuleKey(request.moduleKey().trim().toUpperCase());
        featureFlag.setEnabledByDefault(request.enabledByDefault());
        featureFlag.setPlatformManagedOnly(request.platformManagedOnly());
        featureFlag.setNotes(trimToNull(request.notes()));
    }

    public FeatureFlagSummaryResponse toSummary(FeatureFlag featureFlag, long overrideCount) {
        return new FeatureFlagSummaryResponse(
                featureFlag.getId(),
                featureFlag.getFlagCode(),
                featureFlag.getName(),
                featureFlag.getModuleKey(),
                featureFlag.isEnabledByDefault(),
                featureFlag.isPlatformManagedOnly(),
                featureFlag.getStatus(),
                overrideCount,
                featureFlag.getUpdatedAt());
    }

    public FeatureFlagDetailResponse toDetail(FeatureFlag featureFlag, long overrideCount) {
        return new FeatureFlagDetailResponse(
                featureFlag.getId(),
                featureFlag.getFlagCode(),
                featureFlag.getName(),
                featureFlag.getDescription(),
                featureFlag.getModuleKey(),
                featureFlag.isEnabledByDefault(),
                featureFlag.isPlatformManagedOnly(),
                featureFlag.getNotes(),
                featureFlag.getStatus(),
                overrideCount,
                featureFlag.getCreatedBy(),
                featureFlag.getCreatedAt(),
                featureFlag.getUpdatedBy(),
                featureFlag.getUpdatedAt());
    }

    public TenantFeatureOverrideResponse toOverrideResponse(TenantFeatureOverride override) {
        return new TenantFeatureOverrideResponse(
                override.getId(),
                override.getTenantId(),
                override.getFeatureFlag().getId(),
                override.getFeatureFlag().getFlagCode(),
                override.isEnabled(),
                override.getNotes(),
                override.getUpdatedBy(),
                override.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}