package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.domain.FeatureFlag;
import com.transportplatform.tms.features.saas.domain.FeatureFlagRepository;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import com.transportplatform.tms.features.saas.domain.TenantFeatureOverrideRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantFeatureResolutionService {

    private final FeatureFlagRepository featureFlagRepository;
    private final TenantFeatureOverrideRepository tenantFeatureOverrideRepository;

    public TenantFeatureResolutionService(FeatureFlagRepository featureFlagRepository,
            TenantFeatureOverrideRepository tenantFeatureOverrideRepository) {
        this.featureFlagRepository = featureFlagRepository;
        this.tenantFeatureOverrideRepository = tenantFeatureOverrideRepository;
    }

    @Transactional(readOnly = true)
    public List<ResolvedFeatureFlag> resolveForTenant(String tenantId) {
        List<FeatureFlag> activeFlags = featureFlagRepository.findAllByStatus(FeatureFlagStatus.ACTIVE);
        Map<Long, Boolean> overrideMap = new LinkedHashMap<>();
        Map<Long, String> overrideNotesMap = new LinkedHashMap<>();
        tenantFeatureOverrideRepository.findAllByTenantId(tenantId).forEach(override -> {
            overrideMap.put(override.getFeatureFlag().getId(), override.isEnabled());
            overrideNotesMap.put(override.getFeatureFlag().getId(), override.getNotes());
        });
        return activeFlags.stream().map(flag -> {
            Boolean overridden = overrideMap.get(flag.getId());
            boolean enabled = overridden != null ? overridden : flag.isEnabledByDefault();
            return new ResolvedFeatureFlag(
                    flag.getId(),
                    flag.getFlagCode(),
                    flag.getName(),
                    flag.getModuleKey(),
                    enabled,
                    overridden != null,
                    overrideNotesMap.get(flag.getId()));
        }).toList();
    }

    public record ResolvedFeatureFlag(
            Long id,
            String flagCode,
            String name,
            String moduleKey,
            boolean enabled,
            boolean tenantOverrideApplied,
            String overrideNotes) {
    }
}