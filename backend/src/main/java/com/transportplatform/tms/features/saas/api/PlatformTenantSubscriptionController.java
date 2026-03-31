package com.transportplatform.tms.features.saas.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.saas.api.request.TenantSubscriptionUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionDetailResponse;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionSummaryResponse;
import com.transportplatform.tms.features.saas.application.TenantSubscriptionService;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/tenant-subscriptions")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformTenantSubscriptionController {

    private final TenantSubscriptionService tenantSubscriptionService;

    public PlatformTenantSubscriptionController(TenantSubscriptionService tenantSubscriptionService) {
        this.tenantSubscriptionService = tenantSubscriptionService;
    }

    @GetMapping
    public ApiResponse<PageResponse<TenantSubscriptionSummaryResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) TenantSubscriptionStatus status,
            @RequestParam(required = false) SubscriptionPlanTier planTier,
            @RequestParam(required = false) Boolean trial,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(
                tenantSubscriptionService.search(keyword, status, planTier, trial, page, size, sortBy, sortDirection));
    }

    @GetMapping("/{tenantSubscriptionId}")
    public ApiResponse<TenantSubscriptionDetailResponse> getById(@PathVariable Long tenantSubscriptionId) {
        return ApiResponse.success(tenantSubscriptionService.getById(tenantSubscriptionId));
    }

    @GetMapping("/tenants/{tenantId}/current")
    public ApiResponse<TenantSubscriptionDetailResponse> getCurrentByTenant(@PathVariable String tenantId) {
        return ApiResponse.success(tenantSubscriptionService.getCurrentByTenant(tenantId));
    }

    @GetMapping("/tenants/{tenantId}/history")
    public ApiResponse<List<TenantSubscriptionSummaryResponse>> listHistory(@PathVariable String tenantId) {
        return ApiResponse.success(tenantSubscriptionService.listHistory(tenantId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TenantSubscriptionDetailResponse> create(
            @Valid @RequestBody TenantSubscriptionUpsertRequest request) {
        return ApiResponse.success(tenantSubscriptionService.create(request));
    }

    @PutMapping("/{tenantSubscriptionId}")
    public ApiResponse<TenantSubscriptionDetailResponse> update(@PathVariable Long tenantSubscriptionId,
            @Valid @RequestBody TenantSubscriptionUpsertRequest request) {
        return ApiResponse.success(tenantSubscriptionService.update(tenantSubscriptionId, request));
    }

    @PostMapping("/{tenantSubscriptionId}/activate")
    public ApiResponse<TenantSubscriptionDetailResponse> activate(@PathVariable Long tenantSubscriptionId) {
        return ApiResponse.success(tenantSubscriptionService.activate(tenantSubscriptionId));
    }

    @PostMapping("/{tenantSubscriptionId}/suspend")
    public ApiResponse<TenantSubscriptionDetailResponse> suspend(@PathVariable Long tenantSubscriptionId) {
        return ApiResponse.success(tenantSubscriptionService.suspend(tenantSubscriptionId));
    }

    @PostMapping("/{tenantSubscriptionId}/cancel")
    public ApiResponse<TenantSubscriptionDetailResponse> cancel(@PathVariable Long tenantSubscriptionId) {
        return ApiResponse.success(tenantSubscriptionService.cancel(tenantSubscriptionId));
    }
}