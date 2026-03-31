package com.transportplatform.tms.features.billing.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.billing.api.request.PricingRuleUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.PricingRuleDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PricingRuleSummaryResponse;
import com.transportplatform.tms.features.billing.application.PricingRuleService;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PricingRuleManagementController {

    private final PricingRuleService pricingRuleService;

    public PricingRuleManagementController(PricingRuleService pricingRuleService) {
        this.pricingRuleService = pricingRuleService;
    }

    @GetMapping("/company/pricing-rules")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<PricingRuleSummaryResponse>> searchCompanyPricingRules(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) PricingRuleStatus status,
            @RequestParam(required = false) PricingModel pricingModel,
            @RequestParam(required = false) BillToType billToType,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) LocalDate effectiveFrom,
            @RequestParam(required = false) LocalDate effectiveTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(pricingRuleService.searchCompanyPricingRules(
                keyword,
                status,
                pricingModel,
                billToType,
                serviceType,
                effectiveFrom,
                effectiveTo,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/pricing-rules/{pricingRuleId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PricingRuleDetailResponse> getCompanyPricingRule(@PathVariable Long pricingRuleId) {
        return ApiResponse.success(pricingRuleService.getCompanyPricingRule(pricingRuleId));
    }

    @PostMapping("/company/pricing-rules")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PricingRuleDetailResponse> createCompanyPricingRule(
            @Valid @RequestBody PricingRuleUpsertRequest request) {
        return ApiResponse.success(pricingRuleService.createCompanyPricingRule(request));
    }

    @PutMapping("/company/pricing-rules/{pricingRuleId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PricingRuleDetailResponse> updateCompanyPricingRule(@PathVariable Long pricingRuleId,
            @Valid @RequestBody PricingRuleUpsertRequest request) {
        return ApiResponse.success(pricingRuleService.updateCompanyPricingRule(pricingRuleId, request));
    }

    @PostMapping("/company/pricing-rules/{pricingRuleId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PricingRuleDetailResponse> activateCompanyPricingRule(@PathVariable Long pricingRuleId) {
        return ApiResponse.success(pricingRuleService.activateCompanyPricingRule(pricingRuleId));
    }

    @PostMapping("/company/pricing-rules/{pricingRuleId}/suspend")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PricingRuleDetailResponse> suspendCompanyPricingRule(@PathVariable Long pricingRuleId) {
        return ApiResponse.success(pricingRuleService.suspendCompanyPricingRule(pricingRuleId));
    }

    @PostMapping("/company/pricing-rules/{pricingRuleId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PricingRuleDetailResponse> deactivateCompanyPricingRule(@PathVariable Long pricingRuleId) {
        return ApiResponse.success(pricingRuleService.deactivateCompanyPricingRule(pricingRuleId));
    }
}
