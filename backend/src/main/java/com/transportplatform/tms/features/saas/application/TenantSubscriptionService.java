package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.saas.api.request.TenantSubscriptionUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionDetailResponse;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionSummaryResponse;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanRepository;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionRepository;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantSubscriptionService {

    private static final Set<TenantSubscriptionStatus> CURRENT_STATUSES = Set.of(
            TenantSubscriptionStatus.ACTIVE,
            TenantSubscriptionStatus.TRIAL,
            TenantSubscriptionStatus.SUSPENDED);

    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final TenantRepository tenantRepository;
    private final TenantSubscriptionMapper tenantSubscriptionMapper;
    private final AuditLogService auditLogService;

    public TenantSubscriptionService(TenantSubscriptionRepository tenantSubscriptionRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            TenantRepository tenantRepository,
            TenantSubscriptionMapper tenantSubscriptionMapper,
            AuditLogService auditLogService) {
        this.tenantSubscriptionRepository = tenantSubscriptionRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.tenantRepository = tenantRepository;
        this.tenantSubscriptionMapper = tenantSubscriptionMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TenantSubscriptionSummaryResponse> search(String keyword,
            TenantSubscriptionStatus status,
            SubscriptionPlanTier planTier,
            Boolean trial,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = tenantSubscriptionRepository.findAll(
                TenantSubscriptionSpecifications.search(keyword, status, planTier, trial),
                pageable).map(tenantSubscriptionMapper::toSummary);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public TenantSubscriptionDetailResponse getById(Long tenantSubscriptionId) {
        return tenantSubscriptionMapper.toDetail(findById(tenantSubscriptionId));
    }

    @Transactional(readOnly = true)
    public TenantSubscriptionDetailResponse getCurrentByTenant(String tenantId) {
        TenantSubscription subscription = tenantSubscriptionRepository
                .findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(tenantId, CURRENT_STATUSES)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "No current tenant subscription was found."));
        return tenantSubscriptionMapper.toDetail(subscription);
    }

    @Transactional
    public TenantSubscriptionDetailResponse create(TenantSubscriptionUpsertRequest request) {
        Tenant tenant = findTenant(request.tenantId());
        SubscriptionPlan subscriptionPlan = findActiveOrInactivePlan(request.subscriptionPlanId());
        TenantSubscriptionStatusWorkflow.ensureValidForUpsert(request.status(), request.isTrial(),
                request.trialEndDate());
        if (tenantSubscriptionRepository.existsByTenant_IdAndStatusIn(tenant.getId(),
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL))) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
                    "The tenant already has an active or trial subscription. Update the current subscription instead.");
        }
        TenantSubscription subscription = new TenantSubscription();
        subscription.setTenant(tenant);
        subscription.setSubscriptionPlan(subscriptionPlan);
        tenantSubscriptionMapper.apply(subscription, request);
        validateDates(subscription);
        syncTenantPlan(tenant, subscriptionPlan);
        TenantSubscription saved = tenantSubscriptionRepository.save(subscription);
        recordAudit(saved, "CREATED", "Tenant subscription was created.", null, snapshot(saved));
        return tenantSubscriptionMapper.toDetail(saved);
    }

    @Transactional
    public TenantSubscriptionDetailResponse update(Long tenantSubscriptionId, TenantSubscriptionUpsertRequest request) {
        TenantSubscription subscription = findById(tenantSubscriptionId);
        Tenant tenant = findTenant(request.tenantId());
        SubscriptionPlan subscriptionPlan = findActiveOrInactivePlan(request.subscriptionPlanId());
        TenantSubscriptionStatusWorkflow.ensureValidForUpsert(request.status(), request.isTrial(),
                request.trialEndDate());
        if (tenantSubscriptionRepository.existsByTenant_IdAndStatusInAndIdNot(tenant.getId(),
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL), subscription.getId())
                && (request.status() == TenantSubscriptionStatus.ACTIVE
                        || request.status() == TenantSubscriptionStatus.TRIAL)) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
                    "The tenant already has another active or trial subscription.");
        }
        Object oldSnapshot = snapshot(subscription);
        subscription.setTenant(tenant);
        subscription.setSubscriptionPlan(subscriptionPlan);
        tenantSubscriptionMapper.apply(subscription, request);
        validateDates(subscription);
        syncTenantPlan(tenant, subscriptionPlan);
        TenantSubscription saved = tenantSubscriptionRepository.save(subscription);
        recordAudit(saved, "UPDATED", "Tenant subscription was updated.", oldSnapshot, snapshot(saved));
        return tenantSubscriptionMapper.toDetail(saved);
    }

    @Transactional
    public TenantSubscriptionDetailResponse activate(Long tenantSubscriptionId) {
        TenantSubscription subscription = findById(tenantSubscriptionId);
        TenantSubscriptionStatusWorkflow.ensureCanActivate(subscription.getStatus());
        if (tenantSubscriptionRepository.existsByTenant_IdAndStatusInAndIdNot(subscription.getTenant().getId(),
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL), subscription.getId())) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
                    "The tenant already has another active or trial subscription.");
        }
        Object oldSnapshot = snapshot(subscription);
        subscription
                .setStatus(subscription.isTrial() ? TenantSubscriptionStatus.TRIAL : TenantSubscriptionStatus.ACTIVE);
        if (subscription.getEffectiveStartDate() == null) {
            subscription.setEffectiveStartDate(LocalDate.now());
        }
        syncTenantPlan(subscription.getTenant(), subscription.getSubscriptionPlan());
        TenantSubscription saved = tenantSubscriptionRepository.save(subscription);
        recordAudit(saved, "ACTIVATED", "Tenant subscription was activated.", oldSnapshot, snapshot(saved));
        return tenantSubscriptionMapper.toDetail(saved);
    }

    @Transactional
    public TenantSubscriptionDetailResponse suspend(Long tenantSubscriptionId) {
        TenantSubscription subscription = findById(tenantSubscriptionId);
        TenantSubscriptionStatusWorkflow.ensureCanSuspend(subscription.getStatus());
        Object oldSnapshot = snapshot(subscription);
        subscription.setStatus(TenantSubscriptionStatus.SUSPENDED);
        TenantSubscription saved = tenantSubscriptionRepository.save(subscription);
        recordAudit(saved, "SUSPENDED", "Tenant subscription was suspended.", oldSnapshot, snapshot(saved));
        return tenantSubscriptionMapper.toDetail(saved);
    }

    @Transactional
    public TenantSubscriptionDetailResponse cancel(Long tenantSubscriptionId) {
        TenantSubscription subscription = findById(tenantSubscriptionId);
        TenantSubscriptionStatusWorkflow.ensureCanCancel(subscription.getStatus());
        Object oldSnapshot = snapshot(subscription);
        subscription.setStatus(TenantSubscriptionStatus.CANCELLED);
        if (subscription.getEffectiveEndDate() == null) {
            subscription.setEffectiveEndDate(LocalDate.now());
        }
        TenantSubscription saved = tenantSubscriptionRepository.save(subscription);
        recordAudit(saved, "CANCELLED", "Tenant subscription was cancelled.", oldSnapshot, snapshot(saved));
        return tenantSubscriptionMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public List<TenantSubscriptionSummaryResponse> listHistory(String tenantId) {
        return tenantSubscriptionRepository.findAllByTenant_IdOrderByEffectiveStartDateDescCreatedAtDesc(tenantId)
                .stream()
                .map(tenantSubscriptionMapper::toSummary)
                .toList();
    }

    private TenantSubscription findById(Long tenantSubscriptionId) {
        return tenantSubscriptionRepository.findById(tenantSubscriptionId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Tenant subscription was not found."));
    }

    private Tenant findTenant(String tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Tenant was not found."));
    }

    private SubscriptionPlan findActiveOrInactivePlan(Long subscriptionPlanId) {
        return subscriptionPlanRepository.findByIdAndStatusIn(subscriptionPlanId,
                List.of(SubscriptionPlanStatus.ACTIVE, SubscriptionPlanStatus.INACTIVE, SubscriptionPlanStatus.DRAFT))
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Subscription plan was not found."));
    }

    private void validateDates(TenantSubscription subscription) {
        if (subscription.getEffectiveEndDate() != null
                && subscription.getEffectiveEndDate().isBefore(subscription.getEffectiveStartDate())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Effective end date must be on or after the effective start date.");
        }
        if (subscription.isTrial()) {
            if (subscription.getTrialEndDate() == null) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                        "Trial subscriptions require a trial end date.");
            }
            if (subscription.getTrialEndDate().isBefore(subscription.getEffectiveStartDate())) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                        "Trial end date must be on or after the effective start date.");
            }
        }
    }

    private void syncTenantPlan(Tenant tenant, SubscriptionPlan subscriptionPlan) {
        tenant.setSubscriptionPlan(subscriptionPlan.getPlanCode());
        tenantRepository.save(tenant);
    }

    private void recordAudit(TenantSubscription subscription, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(null, null, "SAAS_TENANT_SUBSCRIPTION", action,
                "TENANT_SUBSCRIPTION", subscription.getId().toString(), summary, oldValue, newValue));
    }

    private Object snapshot(TenantSubscription subscription) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", subscription.getId());
        values.put("tenantId", subscription.getTenant().getId());
        values.put("tenantCode", subscription.getTenant().getTenantCode());
        values.put("planCode", subscription.getSubscriptionPlan().getPlanCode());
        values.put("status", subscription.getStatus() == null ? null : subscription.getStatus().name());
        values.put("effectiveStartDate", subscription.getEffectiveStartDate());
        values.put("effectiveEndDate", subscription.getEffectiveEndDate());
        values.put("trial", subscription.isTrial());
        values.put("trialEndDate", subscription.getTrialEndDate());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "effectiveStartDate", "effectiveEndDate", "renewalDate", "status", "updatedAt", "createdAt" ->
                resolved;
            default -> "updatedAt";
        };
    }
}