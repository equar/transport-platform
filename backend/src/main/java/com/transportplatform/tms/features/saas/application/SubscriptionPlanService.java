package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.saas.api.request.SubscriptionPlanUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanDetailResponse;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanSummaryResponse;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanRepository;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionPlanMapper subscriptionPlanMapper;
    private final SubscriptionPlanCodeGenerator subscriptionPlanCodeGenerator;
    private final AuditLogService auditLogService;

    public SubscriptionPlanService(SubscriptionPlanRepository subscriptionPlanRepository,
            SubscriptionPlanMapper subscriptionPlanMapper,
            SubscriptionPlanCodeGenerator subscriptionPlanCodeGenerator,
            AuditLogService auditLogService) {
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriptionPlanMapper = subscriptionPlanMapper;
        this.subscriptionPlanCodeGenerator = subscriptionPlanCodeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SubscriptionPlanSummaryResponse> search(String keyword,
            SubscriptionPlanStatus status,
            SubscriptionPlanTier tier,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = subscriptionPlanRepository.findAll(
                SubscriptionPlanSpecifications.search(keyword, status, tier),
                pageable).map(subscriptionPlanMapper::toSummary);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public SubscriptionPlanDetailResponse getById(Long subscriptionPlanId) {
        return subscriptionPlanMapper.toDetail(findById(subscriptionPlanId));
    }

    @Transactional
    public SubscriptionPlanDetailResponse create(SubscriptionPlanUpsertRequest request) {
        SubscriptionPlan subscriptionPlan = new SubscriptionPlan();
        subscriptionPlan.setPlanCode(subscriptionPlanCodeGenerator.generate(request.name(), request.planCode()));
        subscriptionPlan.setStatus(SubscriptionPlanStatus.DRAFT);
        subscriptionPlanMapper.apply(subscriptionPlan, request);
        validateUniqueness(subscriptionPlan.getPlanCode(), null);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        recordAudit(saved, "CREATED", "Subscription plan " + saved.getPlanCode() + " was created.", null,
                snapshot(saved));
        return subscriptionPlanMapper.toDetail(saved);
    }

    @Transactional
    public SubscriptionPlanDetailResponse update(Long subscriptionPlanId, SubscriptionPlanUpsertRequest request) {
        SubscriptionPlan subscriptionPlan = findById(subscriptionPlanId);
        Object oldSnapshot = snapshot(subscriptionPlan);
        String nextPlanCode = request.planCode() != null && !request.planCode().isBlank()
                ? subscriptionPlanCodeGenerator.normalize(request.planCode())
                : subscriptionPlan.getPlanCode();
        validateUniqueness(nextPlanCode, subscriptionPlanId);
        subscriptionPlan.setPlanCode(nextPlanCode);
        subscriptionPlanMapper.apply(subscriptionPlan, request);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        recordAudit(saved, "UPDATED", "Subscription plan " + saved.getPlanCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return subscriptionPlanMapper.toDetail(saved);
    }

    @Transactional
    public SubscriptionPlanDetailResponse activate(Long subscriptionPlanId) {
        SubscriptionPlan subscriptionPlan = findById(subscriptionPlanId);
        SubscriptionPlanStatusWorkflow.ensureCanActivate(subscriptionPlan.getStatus());
        Object oldSnapshot = snapshot(subscriptionPlan);
        subscriptionPlan.setStatus(SubscriptionPlanStatus.ACTIVE);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        recordAudit(saved, "ACTIVATED", "Subscription plan " + saved.getPlanCode() + " was activated.", oldSnapshot,
                snapshot(saved));
        return subscriptionPlanMapper.toDetail(saved);
    }

    @Transactional
    public SubscriptionPlanDetailResponse deactivate(Long subscriptionPlanId) {
        SubscriptionPlan subscriptionPlan = findById(subscriptionPlanId);
        SubscriptionPlanStatusWorkflow.ensureCanDeactivate(subscriptionPlan.getStatus());
        Object oldSnapshot = snapshot(subscriptionPlan);
        subscriptionPlan.setStatus(SubscriptionPlanStatus.INACTIVE);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        recordAudit(saved, "DEACTIVATED", "Subscription plan " + saved.getPlanCode() + " was deactivated.", oldSnapshot,
                snapshot(saved));
        return subscriptionPlanMapper.toDetail(saved);
    }

    @Transactional
    public SubscriptionPlanDetailResponse retire(Long subscriptionPlanId) {
        SubscriptionPlan subscriptionPlan = findById(subscriptionPlanId);
        SubscriptionPlanStatusWorkflow.ensureCanRetire(subscriptionPlan.getStatus());
        Object oldSnapshot = snapshot(subscriptionPlan);
        subscriptionPlan.setStatus(SubscriptionPlanStatus.RETIRED);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        recordAudit(saved, "RETIRED", "Subscription plan " + saved.getPlanCode() + " was retired.", oldSnapshot,
                snapshot(saved));
        return subscriptionPlanMapper.toDetail(saved);
    }

    private SubscriptionPlan findById(Long subscriptionPlanId) {
        return subscriptionPlanRepository.findById(subscriptionPlanId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Subscription plan was not found."));
    }

    private void validateUniqueness(String planCode, Long subscriptionPlanId) {
        boolean exists = subscriptionPlanId == null
                ? subscriptionPlanRepository.existsByPlanCodeIgnoreCase(planCode)
                : subscriptionPlanRepository.existsByPlanCodeIgnoreCaseAndIdNot(planCode, subscriptionPlanId);
        if (exists) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
                    "Subscription plan code is already in use.");
        }
    }

    private void recordAudit(SubscriptionPlan plan, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(null, null, "SAAS_SUBSCRIPTION_PLAN", action,
                "SUBSCRIPTION_PLAN", plan.getId().toString(), summary, oldValue, newValue));
    }

    private Object snapshot(SubscriptionPlan plan) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", plan.getId());
        values.put("planCode", plan.getPlanCode());
        values.put("name", plan.getName());
        values.put("tier", plan.getTier() == null ? null : plan.getTier().name());
        values.put("status", plan.getStatus() == null ? null : plan.getStatus().name());
        values.put("maxUsers", plan.getMaxUsers());
        values.put("includedFeatureCodes", plan.getIncludedFeatureCodes());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "planCode", "name", "tier", "monthlyPrice", "annualPrice", "status", "createdAt", "updatedAt" ->
                resolved;
            default -> "updatedAt";
        };
    }
}