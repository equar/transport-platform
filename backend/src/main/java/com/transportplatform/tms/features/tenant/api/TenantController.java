package com.transportplatform.tms.features.tenant.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.tenant.api.request.TenantUpsertRequest;
import com.transportplatform.tms.features.tenant.api.response.TenantResponse;
import com.transportplatform.tms.features.tenant.application.TenantService;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import jakarta.validation.Valid;
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
@RequestMapping("/platform/tenants")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping
    public ApiResponse<PageResponse<TenantResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) TenantStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(tenantService.search(keyword, status, page, size));
    }

    @GetMapping("/{tenantId}")
    public ApiResponse<TenantResponse> getById(@PathVariable String tenantId) {
        return ApiResponse.success(tenantService.getById(tenantId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TenantResponse> create(@Valid @RequestBody TenantUpsertRequest request) {
        return ApiResponse.success(tenantService.create(request));
    }

    @PutMapping("/{tenantId}")
    public ApiResponse<TenantResponse> update(@PathVariable String tenantId,
            @Valid @RequestBody TenantUpsertRequest request) {
        return ApiResponse.success(tenantService.update(tenantId, request));
    }

    @PostMapping("/{tenantId}/activate")
    public ApiResponse<TenantResponse> activate(@PathVariable String tenantId) {
        return ApiResponse.success(tenantService.activate(tenantId));
    }

    @PostMapping("/{tenantId}/suspend")
    public ApiResponse<TenantResponse> suspend(@PathVariable String tenantId) {
        return ApiResponse.success(tenantService.suspend(tenantId));
    }
}
