package com.transportplatform.tms.features.role.application;

import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.role.api.response.RoleCatalogItemResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoleCatalogService {

    private final AppUserRepository appUserRepository;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;

    public RoleCatalogService(AppUserRepository appUserRepository,
            CurrentAuthenticatedUserService currentAuthenticatedUserService) {
        this.appUserRepository = appUserRepository;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
    }

    @Transactional(readOnly = true)
    public List<RoleCatalogItemResponse> getPlatformRoleCatalog() {
        requirePlatformAdmin();
        return Arrays.stream(RoleName.values())
                .map(role -> toResponse(role, null, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleCatalogItemResponse> getCompanyRoleCatalog() {
        String tenantId = requireCompanyAdminTenantId();
        return Arrays.stream(RoleName.values())
                .filter(role -> role != RoleName.ROLE_PLATFORM_ADMIN)
                .map(role -> toResponse(role, tenantId, true))
                .toList();
    }

    private RoleCatalogItemResponse toResponse(RoleName role, String tenantId, boolean assignable) {
        return new RoleCatalogItemResponse(
                role.name(),
                displayName(role),
                description(role),
                scope(role),
                assignable,
                tenantId == null ? appUserRepository.countByRole(role)
                        : appUserRepository.countByRoleAndTenantScope(role, tenantId));
    }

    private String displayName(RoleName role) {
        return switch (role) {
            case ROLE_PLATFORM_ADMIN -> "Platform Admin";
            case ROLE_TENANT_ADMIN -> "Company Admin";
            case ROLE_DISPATCHER -> "Dispatcher";
            case ROLE_DRIVER -> "Driver";
            case ROLE_VIEWER -> "Viewer";
        };
    }

    private String description(RoleName role) {
        return switch (role) {
            case ROLE_PLATFORM_ADMIN -> "Global control over tenants, onboarding, users, and platform operations.";
            case ROLE_TENANT_ADMIN ->
                "Tenant-scoped administration for company users, role assignment, and company dashboards.";
            case ROLE_DISPATCHER -> "Operational access to scheduling and dispatch workflows.";
            case ROLE_DRIVER -> "Driver-facing operational access.";
            case ROLE_VIEWER -> "Read-only access for oversight and reporting.";
        };
    }

    private String scope(RoleName role) {
        return role == RoleName.ROLE_PLATFORM_ADMIN ? "PLATFORM" : "TENANT";
    }

    private void requirePlatformAdmin() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean hasRole = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_PLATFORM_ADMIN.name()));
        if (!hasRole) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform administrator access is required.");
        }
    }

    private String requireCompanyAdminTenantId() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean hasRole = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!hasRole || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Company administrator access is required.");
        }
        return user.tenantId();
    }
}