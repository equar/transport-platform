package com.transportplatform.tms.features.branding.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.branding.application.TenantBrandingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class TenantBrandingController {
    public record ThemeSelection(@NotBlank @Size(max = 40) String themeCode) {}
    private final TenantBrandingService themes;
    public TenantBrandingController(TenantBrandingService themes) { this.themes = themes; }
    @GetMapping("/company/branding-theme")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<TenantBrandingService.ThemeState> getOwn() { return ApiResponse.success(themes.get(themes.currentTenantId())); }
    @PutMapping("/company/branding-theme")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<TenantBrandingService.ThemeState> applyOwn(@Valid @RequestBody ThemeSelection selection) {
        return ApiResponse.success(themes.apply(themes.currentTenantId(), selection.themeCode()));
    }
    @GetMapping("/platform/tenants/{tenantId}/branding-theme")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<TenantBrandingService.ThemeState> get(@PathVariable String tenantId) { return ApiResponse.success(themes.get(tenantId)); }
    @PutMapping("/platform/tenants/{tenantId}/branding-theme")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<TenantBrandingService.ThemeState> apply(@PathVariable String tenantId, @Valid @RequestBody ThemeSelection selection) {
        return ApiResponse.success(themes.apply(tenantId, selection.themeCode()));
    }
}
