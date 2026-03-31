package com.transportplatform.tms.features.saas.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.saas.api.request.SubscriptionPlanUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanDetailResponse;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanSummaryResponse;
import com.transportplatform.tms.features.saas.application.SubscriptionPlanService;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import jakarta.validation.Valid;
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
@RequestMapping("/platform/subscription-plans")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformSubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    public PlatformSubscriptionPlanController(SubscriptionPlanService subscriptionPlanService) {
        this.subscriptionPlanService = subscriptionPlanService;
    }

    @GetMapping
    public ApiResponse<PageResponse<SubscriptionPlanSummaryResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) SubscriptionPlanStatus status,
            @RequestParam(required = false) SubscriptionPlanTier tier,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse
                .success(subscriptionPlanService.search(keyword, status, tier, page, size, sortBy, sortDirection));
    }

    @GetMapping("/{subscriptionPlanId}")
    public ApiResponse<SubscriptionPlanDetailResponse> getById(@PathVariable Long subscriptionPlanId) {
        return ApiResponse.success(subscriptionPlanService.getById(subscriptionPlanId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SubscriptionPlanDetailResponse> create(
            @Valid @RequestBody SubscriptionPlanUpsertRequest request) {
        return ApiResponse.success(subscriptionPlanService.create(request));
    }

    @PutMapping("/{subscriptionPlanId}")
    public ApiResponse<SubscriptionPlanDetailResponse> update(@PathVariable Long subscriptionPlanId,
            @Valid @RequestBody SubscriptionPlanUpsertRequest request) {
        return ApiResponse.success(subscriptionPlanService.update(subscriptionPlanId, request));
    }

    @PostMapping("/{subscriptionPlanId}/activate")
    public ApiResponse<SubscriptionPlanDetailResponse> activate(@PathVariable Long subscriptionPlanId) {
        return ApiResponse.success(subscriptionPlanService.activate(subscriptionPlanId));
    }

    @PostMapping("/{subscriptionPlanId}/deactivate")
    public ApiResponse<SubscriptionPlanDetailResponse> deactivate(@PathVariable Long subscriptionPlanId) {
        return ApiResponse.success(subscriptionPlanService.deactivate(subscriptionPlanId));
    }

    @PostMapping("/{subscriptionPlanId}/retire")
    public ApiResponse<SubscriptionPlanDetailResponse> retire(@PathVariable Long subscriptionPlanId) {
        return ApiResponse.success(subscriptionPlanService.retire(subscriptionPlanId));
    }
}