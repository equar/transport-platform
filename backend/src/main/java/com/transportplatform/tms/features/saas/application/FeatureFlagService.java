package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.saas.api.request.FeatureFlagUpsertRequest;
import com.transportplatform.tms.features.saas.api.request.TenantFeatureOverrideUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagDetailResponse;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagSummaryResponse;
import com.transportplatform.tms.features.saas.api.response.TenantFeatureOverrideResponse;
import com.transportplatform.tms.features.saas.domain.FeatureFlag;
import com.transportplatform.tms.features.saas.domain.FeatureFlagRepository;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import com.transportplatform.tms.features.saas.domain.TenantFeatureOverride;
import com.transportplatform.tms.features.saas.domain.TenantFeatureOverrideRepository;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final TenantFeatureOverrideRepository tenantFeatureOverrideRepository;
    private final TenantRepository tenantRepository;
    private final FeatureFlagMapper featureFlagMapper;
    private final FeatureFlagCodeGenerator featureFlagCodeGenerator;
    private final AuditLogService auditLogService;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository,
            TenantFeatureOverrideRepository tenantFeatureOverrideRepository,
            TenantRepository tenantRepository,
            FeatureFlagMapper featureFlagMapper,
            FeatureFlagCodeGenerator featureFlagCodeGenerator,
            AuditLogService auditLogService) {
        this.featureFlagRepository = featureFlagRepository;
        this.tenantFeatureOverrideRepository = tenantFeatureOverrideRepository;
        this.tenantRepository = tenantRepository;
        this.featureFlagMapper = featureFlagMapper;
        this.featureFlagCodeGenerator = featureFlagCodeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<FeatureFlagSummaryResponse> search(String keyword,
            FeatureFlagStatus status,
            String moduleKey,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = featureFlagRepository
                .findAll(FeatureFlagSpecifications.search(keyword, status, moduleKey), pageable)
                .map(flag -> featureFlagMapper.toSummary(flag,
                        tenantFeatureOverrideRepository.countByFeatureFlag_Id(flag.getId())));
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public FeatureFlagDetailResponse getById(Long featureFlagId) {
        FeatureFlag featureFlag = findById(featureFlagId);
        return featureFlagMapper.toDetail(featureFlag,
                tenantFeatureOverrideRepository.countByFeatureFlag_Id(featureFlagId));
    }

    @Transactional
    public FeatureFlagDetailResponse create(FeatureFlagUpsertRequest request) {
        FeatureFlag featureFlag = new FeatureFlag();
        featureFlag.setFlagCode(featureFlagCodeGenerator.generate(request.name(), request.flagCode()));
        featureFlag.setStatus(FeatureFlagStatus.ACTIVE);
        featureFlagMapper.apply(featureFlag, request);
        validateUniqueness(featureFlag.getFlagCode(), null);
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        recordAudit(saved, "CREATED", "Feature flag " + saved.getFlagCode() + " was created.", null, snapshot(saved));
        return featureFlagMapper.toDetail(saved, 0);
    }

    @Transactional
    public FeatureFlagDetailResponse update(Long featureFlagId, FeatureFlagUpsertRequest request) {
        FeatureFlag featureFlag = findById(featureFlagId);
        Object oldSnapshot = snapshot(featureFlag);
        String nextCode = request.flagCode() != null && !request.flagCode().isBlank()
                ? featureFlagCodeGenerator.normalize(request.flagCode())
                : featureFlag.getFlagCode();
        validateUniqueness(nextCode, featureFlagId);
        featureFlag.setFlagCode(nextCode);
        featureFlagMapper.apply(featureFlag, request);
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        recordAudit(saved, "UPDATED", "Feature flag " + saved.getFlagCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return featureFlagMapper.toDetail(saved, tenantFeatureOverrideRepository.countByFeatureFlag_Id(saved.getId()));
    }

    @Transactional
    public FeatureFlagDetailResponse activate(Long featureFlagId) {
        FeatureFlag featureFlag = findById(featureFlagId);
        FeatureFlagStatusWorkflow.ensureCanActivate(featureFlag.getStatus());
        Object oldSnapshot = snapshot(featureFlag);
        featureFlag.setStatus(FeatureFlagStatus.ACTIVE);
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        recordAudit(saved, "ACTIVATED", "Feature flag " + saved.getFlagCode() + " was activated.", oldSnapshot,
                snapshot(saved));
        return featureFlagMapper.toDetail(saved, tenantFeatureOverrideRepository.countByFeatureFlag_Id(saved.getId()));
    }

    @Transactional
    public FeatureFlagDetailResponse deactivate(Long featureFlagId) {
        FeatureFlag featureFlag = findById(featureFlagId);
        FeatureFlagStatusWorkflow.ensureCanDeactivate(featureFlag.getStatus());
        Object oldSnapshot = snapshot(featureFlag);
        featureFlag.setStatus(FeatureFlagStatus.INACTIVE);
        FeatureFlag saved = featureFlagRepository.save(featureFlag);
        recordAudit(saved, "DEACTIVATED", "Feature flag " + saved.getFlagCode() + " was deactivated.", oldSnapshot,
                snapshot(saved));
        return featureFlagMapper.toDetail(saved, tenantFeatureOverrideRepository.countByFeatureFlag_Id(saved.getId()));
    }

    @Transactional
    public TenantFeatureOverrideResponse upsertTenantOverride(Long featureFlagId,
            TenantFeatureOverrideUpsertRequest request) {
        if (!tenantRepository.existsById(request.tenantId())) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Tenant was not found.");
        }
        FeatureFlag featureFlag = findById(featureFlagId);
        TenantFeatureOverride override = tenantFeatureOverrideRepository
                .findByTenantIdAndFeatureFlag_Id(request.tenantId(), featureFlagId)
                .orElseGet(TenantFeatureOverride::new);
        Object oldSnapshot = override.getId() == null ? null : snapshot(override);
        override.setTenantId(request.tenantId());
        override.setFeatureFlag(featureFlag);
        override.setEnabled(request.enabled());
        override.setNotes(request.notes() == null || request.notes().isBlank() ? null : request.notes().trim());
        TenantFeatureOverride saved = tenantFeatureOverrideRepository.save(override);
        auditLogService.record(new AuditLogCommand(null, null, "SAAS_FEATURE_FLAG", "OVERRIDE_UPDATED",
                "TENANT_FEATURE_OVERRIDE", saved.getId().toString(),
                "Tenant feature override for " + featureFlag.getFlagCode() + " was updated.", oldSnapshot,
                snapshot(saved)));
        return featureFlagMapper.toOverrideResponse(saved);
    }

    private FeatureFlag findById(Long featureFlagId) {
        return featureFlagRepository.findById(featureFlagId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Feature flag was not found."));
    }

    private void validateUniqueness(String flagCode, Long featureFlagId) {
        boolean exists = featureFlagId == null
                ? featureFlagRepository.existsByFlagCodeIgnoreCase(flagCode)
                : featureFlagRepository.existsByFlagCodeIgnoreCaseAndIdNot(flagCode, featureFlagId);
        if (exists) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
                    "Feature flag code is already in use.");
        }
    }

    private void recordAudit(FeatureFlag featureFlag, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(null, null, "SAAS_FEATURE_FLAG", action,
                "FEATURE_FLAG", featureFlag.getId().toString(), summary, oldValue, newValue));
    }

    private Object snapshot(FeatureFlag featureFlag) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", featureFlag.getId());
        values.put("flagCode", featureFlag.getFlagCode());
        values.put("moduleKey", featureFlag.getModuleKey());
        values.put("enabledByDefault", featureFlag.isEnabledByDefault());
        values.put("status", featureFlag.getStatus() == null ? null : featureFlag.getStatus().name());
        return values;
    }

    private Object snapshot(TenantFeatureOverride override) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", override.getId());
        values.put("tenantId", override.getTenantId());
        values.put("featureFlagId", override.getFeatureFlag().getId());
        values.put("flagCode", override.getFeatureFlag().getFlagCode());
        values.put("enabled", override.isEnabled());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "flagCode", "name", "moduleKey", "status", "createdAt", "updatedAt" -> resolved;
            default -> "updatedAt";
        };
    }
}