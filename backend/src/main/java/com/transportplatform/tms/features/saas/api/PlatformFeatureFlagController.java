package com.transportplatform.tms.features.saas.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.saas.api.request.FeatureFlagUpsertRequest;
import com.transportplatform.tms.features.saas.api.request.TenantFeatureOverrideUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagDetailResponse;
import com.transportplatform.tms.features.saas.api.response.FeatureFlagSummaryResponse;
import com.transportplatform.tms.features.saas.api.response.TenantFeatureOverrideResponse;
import com.transportplatform.tms.features.saas.application.FeatureFlagService;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
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
@RequestMapping("/platform/feature-flags")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformFeatureFlagController {

    private final FeatureFlagService featureFlagService;

    public PlatformFeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    public ApiResponse<PageResponse<FeatureFlagSummaryResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) FeatureFlagStatus status,
            @RequestParam(required = false) String moduleKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse
                .success(featureFlagService.search(keyword, status, moduleKey, page, size, sortBy, sortDirection));
    }

    @GetMapping("/{featureFlagId}")
    public ApiResponse<FeatureFlagDetailResponse> getById(@PathVariable Long featureFlagId) {
        return ApiResponse.success(featureFlagService.getById(featureFlagId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FeatureFlagDetailResponse> create(@Valid @RequestBody FeatureFlagUpsertRequest request) {
        return ApiResponse.success(featureFlagService.create(request));
    }

    @PutMapping("/{featureFlagId}")
    public ApiResponse<FeatureFlagDetailResponse> update(@PathVariable Long featureFlagId,
            @Valid @RequestBody FeatureFlagUpsertRequest request) {
        return ApiResponse.success(featureFlagService.update(featureFlagId, request));
    }

    @PostMapping("/{featureFlagId}/activate")
    public ApiResponse<FeatureFlagDetailResponse> activate(@PathVariable Long featureFlagId) {
        return ApiResponse.success(featureFlagService.activate(featureFlagId));
    }

    @PostMapping("/{featureFlagId}/deactivate")
    public ApiResponse<FeatureFlagDetailResponse> deactivate(@PathVariable Long featureFlagId) {
        return ApiResponse.success(featureFlagService.deactivate(featureFlagId));
    }

    @PutMapping("/{featureFlagId}/tenant-overrides")
    public ApiResponse<TenantFeatureOverrideResponse> upsertTenantOverride(@PathVariable Long featureFlagId,
            @Valid @RequestBody TenantFeatureOverrideUpsertRequest request) {
        return ApiResponse.success(featureFlagService.upsertTenantOverride(featureFlagId, request));
    }
}