package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.request.PricingRuleUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.PricingRuleDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PricingRuleSummaryResponse;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PricingRuleService {

    private final PricingRuleRepository pricingRuleRepository;
    private final BillingAccessService billingAccessService;
    private final PricingRuleMapper pricingRuleMapper;
    private final PricingRuleCodeGenerator pricingRuleCodeGenerator;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public PricingRuleService(PricingRuleRepository pricingRuleRepository,
            BillingAccessService billingAccessService,
            PricingRuleMapper pricingRuleMapper,
            PricingRuleCodeGenerator pricingRuleCodeGenerator,
            AuditLogService auditLogService,
            Clock clock) {
        this.pricingRuleRepository = pricingRuleRepository;
        this.billingAccessService = billingAccessService;
        this.pricingRuleMapper = pricingRuleMapper;
        this.pricingRuleCodeGenerator = pricingRuleCodeGenerator;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<PricingRuleSummaryResponse> searchCompanyPricingRules(String keyword,
            PricingRuleStatus status,
            PricingModel pricingModel,
            BillToType billToType,
            ServiceType serviceType,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = pricingRuleRepository.findAll(
                PricingRuleSpecifications.search(tenantId, keyword, status, pricingModel, billToType, serviceType,
                        effectiveFrom, effectiveTo, today),
                pageable);
        return PageResponse.from(result.map(rule -> pricingRuleMapper.toSummary(
                rule,
                PricingRuleStatusWorkflow.resolveEffectiveStatus(rule, today))));
    }

    @Transactional(readOnly = true)
    public PricingRuleDetailResponse getCompanyPricingRule(Long pricingRuleId) {
        PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(pricingRuleId);
        return pricingRuleMapper.toDetail(pricingRule,
                PricingRuleStatusWorkflow.resolveEffectiveStatus(pricingRule, LocalDate.now(clock)));
    }

    @Transactional
    public PricingRuleDetailResponse createCompanyPricingRule(PricingRuleUpsertRequest request) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        PricingRule pricingRule = new PricingRule();
        pricingRule.setTenantId(tenantId);
        pricingRule.setPricingRuleCode(pricingRuleCodeGenerator.generate(tenantId));
        pricingRule.setStatus(PricingRuleStatus.DRAFT);
        pricingRuleMapper.apply(pricingRule, request);
        validateBusinessRules(pricingRule, null);
        PricingRule saved = pricingRuleRepository.save(pricingRule);
        recordAudit(saved, "CREATED", "Pricing rule " + saved.getPricingRuleCode() + " was created.", null,
                snapshot(saved));
        return pricingRuleMapper.toDetail(saved,
                PricingRuleStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    @Transactional
    public PricingRuleDetailResponse updateCompanyPricingRule(Long pricingRuleId, PricingRuleUpsertRequest request) {
        PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(pricingRuleId);
        Object oldSnapshot = snapshot(pricingRule);
        pricingRuleMapper.apply(pricingRule, request);
        validateBusinessRules(pricingRule, pricingRuleId);
        PricingRule saved = pricingRuleRepository.save(pricingRule);
        recordAudit(saved, "UPDATED", "Pricing rule " + saved.getPricingRuleCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return pricingRuleMapper.toDetail(saved,
                PricingRuleStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    @Transactional
    public PricingRuleDetailResponse activateCompanyPricingRule(Long pricingRuleId) {
        PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(pricingRuleId);
        PricingRuleStatusWorkflow.ensureCanActivate(pricingRule, LocalDate.now(clock));
        return updateStatus(pricingRule, PricingRuleStatus.ACTIVE, "ACTIVATED",
                "Pricing rule " + pricingRule.getPricingRuleCode() + " was activated.");
    }

    @Transactional
    public PricingRuleDetailResponse suspendCompanyPricingRule(Long pricingRuleId) {
        PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(pricingRuleId);
        PricingRuleStatusWorkflow.ensureCanSuspend(pricingRule, LocalDate.now(clock));
        return updateStatus(pricingRule, PricingRuleStatus.SUSPENDED, "SUSPENDED",
                "Pricing rule " + pricingRule.getPricingRuleCode() + " was suspended.");
    }

    @Transactional
    public PricingRuleDetailResponse deactivateCompanyPricingRule(Long pricingRuleId) {
        PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(pricingRuleId);
        PricingRuleStatusWorkflow.ensureCanDeactivate(pricingRule.getStatus());
        return updateStatus(pricingRule, PricingRuleStatus.INACTIVE, "DEACTIVATED",
                "Pricing rule " + pricingRule.getPricingRuleCode() + " was marked inactive.");
    }

    private PricingRuleDetailResponse updateStatus(PricingRule pricingRule,
            PricingRuleStatus status,
            String action,
            String summary) {
        Object oldSnapshot = snapshot(pricingRule);
        pricingRule.setStatus(status);
        PricingRule saved = pricingRuleRepository.save(pricingRule);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return pricingRuleMapper.toDetail(saved,
                PricingRuleStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    private void validateBusinessRules(PricingRule pricingRule, Long currentId) {
        if (pricingRule.getEffectiveEndDate() != null
                && pricingRule.getEffectiveEndDate().isBefore(pricingRule.getEffectiveStartDate())) {
            throw validationFailure("The pricing rule effective end date cannot be earlier than the start date.");
        }
        boolean conflict = pricingRuleRepository.findAll(PricingRuleSpecifications.search(
                pricingRule.getTenantId(),
                null,
                null,
                null,
                pricingRule.getBillToType(),
                pricingRule.getServiceType(),
                pricingRule.getEffectiveStartDate(),
                pricingRule.getEffectiveEndDate(),
                LocalDate.now(clock))).stream()
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .filter(existing -> existing.getPricingModel() == pricingRule.getPricingModel())
                .filter(existing -> existing.getPriorityOrder().equals(pricingRule.getPriorityOrder()))
                .filter(existing -> sameApplicability(existing, pricingRule))
                .anyMatch(existing -> overlaps(existing.getEffectiveStartDate(), existing.getEffectiveEndDate(),
                        pricingRule.getEffectiveStartDate(), pricingRule.getEffectiveEndDate()));
        if (conflict) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "A pricing rule with the same applicability, priority, and overlapping effective dates already exists.");
        }
    }

    private boolean sameApplicability(PricingRule left, PricingRule right) {
        return left.getBillToType() == right.getBillToType()
                && left.getServiceType() == right.getServiceType()
                && left.getRiderType() == right.getRiderType()
                && left.getOrganizationType() == right.getOrganizationType()
                && left.getContractType() == right.getContractType()
                && left.getTripType() == right.getTripType();
    }

    private boolean overlaps(LocalDate leftStart, LocalDate leftEnd, LocalDate rightStart, LocalDate rightEnd) {
        LocalDate resolvedLeftEnd = leftEnd == null ? LocalDate.MAX : leftEnd;
        LocalDate resolvedRightEnd = rightEnd == null ? LocalDate.MAX : rightEnd;
        return !resolvedLeftEnd.isBefore(rightStart) && !resolvedRightEnd.isBefore(leftStart);
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private void recordAudit(PricingRule pricingRule, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                pricingRule.getTenantId(),
                "PRICING_RULE",
                action,
                "PRICING_RULE",
                pricingRule.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(PricingRule pricingRule) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", pricingRule.getId());
        values.put("pricingRuleCode", pricingRule.getPricingRuleCode());
        values.put("name", pricingRule.getName());
        values.put("pricingModel", pricingRule.getPricingModel() == null ? null : pricingRule.getPricingModel().name());
        values.put("billToType", pricingRule.getBillToType() == null ? null : pricingRule.getBillToType().name());
        values.put("serviceType", pricingRule.getServiceType() == null ? null : pricingRule.getServiceType().name());
        values.put("amount", pricingRule.getAmount());
        values.put("currency", pricingRule.getCurrency());
        values.put("effectiveStartDate", pricingRule.getEffectiveStartDate());
        values.put("effectiveEndDate", pricingRule.getEffectiveEndDate());
        values.put("priorityOrder", pricingRule.getPriorityOrder());
        values.put("status", pricingRule.getStatus() == null ? null : pricingRule.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "pricingRuleCode", "name", "effectiveStartDate", "effectiveEndDate",
                    "priorityOrder", "status" ->
                resolved;
            default -> "updatedAt";
        };
    }
}
