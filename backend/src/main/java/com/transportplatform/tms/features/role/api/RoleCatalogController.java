package com.transportplatform.tms.features.role.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.role.api.response.RoleCatalogItemResponse;
import com.transportplatform.tms.features.role.application.RoleCatalogService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RoleCatalogController {

    private final RoleCatalogService roleCatalogService;

    public RoleCatalogController(RoleCatalogService roleCatalogService) {
        this.roleCatalogService = roleCatalogService;
    }

    @GetMapping("/platform/roles")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<List<RoleCatalogItemResponse>> getPlatformRoles() {
        return ApiResponse.success(roleCatalogService.getPlatformRoleCatalog());
    }

    @GetMapping("/company/roles")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<RoleCatalogItemResponse>> getCompanyRoles() {
        return ApiResponse.success(roleCatalogService.getCompanyRoleCatalog());
    }
}