package com.transportplatform.tms.features.runtime.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeBrandingResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeTenantCapabilitiesResponse;
import com.transportplatform.tms.features.runtime.application.RuntimeCapabilitiesService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/runtime")
public class RuntimeCapabilitiesController {

    private final RuntimeCapabilitiesService runtimeCapabilitiesService;

    public RuntimeCapabilitiesController(RuntimeCapabilitiesService runtimeCapabilitiesService) {
        this.runtimeCapabilitiesService = runtimeCapabilitiesService;
    }

    @GetMapping("/tenant-capabilities")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<RuntimeTenantCapabilitiesResponse> getCurrentTenantCapabilities() {
        return ApiResponse.success(runtimeCapabilitiesService.getCurrentTenantCapabilities());
    }

    @GetMapping("/tenant-branding")
    public ApiResponse<RuntimeBrandingResponse> getTenantBranding(@RequestParam String tenantId) {
        return ApiResponse.success(runtimeCapabilitiesService.getTenantBranding(tenantId));
    }
}