package com.transportplatform.tms.features.user.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.user.api.request.AdminResetPasswordRequest;
import com.transportplatform.tms.features.user.api.request.UserUpsertRequest;
import com.transportplatform.tms.features.user.api.response.UserResponse;
import com.transportplatform.tms.features.user.api.response.PortalSubjectOptionResponse;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import java.util.List;
import com.transportplatform.tms.features.user.application.UserManagementService;
import jakarta.validation.Valid;
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
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/platform/users")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<PageResponse<UserResponse>> searchPlatformUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) RoleName role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse
                .success(userManagementService.searchPlatformUsers(keyword, tenantId, status, role, page, size));
    }

    @GetMapping("/platform/users/{userId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> getPlatformUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.getPlatformUser(userId));
    }

    @PostMapping("/platform/users")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createPlatformUser(@Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.success(userManagementService.createPlatformUser(request));
    }

    @PutMapping("/platform/users/{userId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> updatePlatformUser(@PathVariable Long userId,
            @Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.success(userManagementService.updatePlatformUser(userId, request));
    }

    @PostMapping("/platform/users/{userId}/reset-password")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> resetPlatformUserPassword(@PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        return ApiResponse.success(userManagementService.resetPlatformUserPassword(userId, request));
    }

    @PostMapping("/platform/users/{userId}/activate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> activatePlatformUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.activatePlatformUser(userId));
    }

    @PostMapping("/platform/users/{userId}/suspend")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> suspendPlatformUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.suspendPlatformUser(userId));
    }

    @PostMapping("/platform/users/{userId}/deactivate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<UserResponse> deactivatePlatformUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.deactivatePlatformUser(userId));
    }

    @GetMapping("/company/users")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<UserResponse>> searchCompanyUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) RoleName role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(userManagementService.searchCompanyUsers(keyword, status, role, page, size));
    }

    @GetMapping("/company/users/portal-subjects")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<PortalSubjectOptionResponse>> listCompanyPortalSubjects(
            @RequestParam PortalSubjectType type,
            @RequestParam(defaultValue = "") String keyword) {
        return ApiResponse.success(userManagementService.listCompanyPortalSubjects(type, keyword));
    }

    @GetMapping("/company/users/{userId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> getCompanyUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.getCompanyUser(userId));
    }

    @PostMapping("/company/users")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createCompanyUser(@Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.success(userManagementService.createCompanyUser(request));
    }

    @PutMapping("/company/users/{userId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> updateCompanyUser(@PathVariable Long userId,
            @Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.success(userManagementService.updateCompanyUser(userId, request));
    }

    @PostMapping("/company/users/{userId}/reset-password")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> resetCompanyUserPassword(@PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        return ApiResponse.success(userManagementService.resetCompanyUserPassword(userId, request));
    }

    @PostMapping("/company/users/{userId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> activateCompanyUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.activateCompanyUser(userId));
    }

    @PostMapping("/company/users/{userId}/suspend")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> suspendCompanyUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.suspendCompanyUser(userId));
    }

    @PostMapping("/company/users/{userId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<UserResponse> deactivateCompanyUser(@PathVariable Long userId) {
        return ApiResponse.success(userManagementService.deactivateCompanyUser(userId));
    }
}
