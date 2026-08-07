package com.transportplatform.tms.features.rider.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.rider.api.request.GuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianResponse;
import com.transportplatform.tms.features.rider.application.GuardianService;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import jakarta.validation.Valid;
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
public class GuardianManagementController {

    private final GuardianService guardianService;

    public GuardianManagementController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @GetMapping("/company/guardians")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<GuardianResponse>> searchCompanyGuardians(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) GuardianStatus status,
            @RequestParam(required = false) Boolean authorizedForPickup,
            @RequestParam(required = false) Boolean billingContact,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(guardianService.searchCompanyGuardians(
                keyword,
                status,
                authorizedForPickup,
                billingContact,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/guardians/{guardianId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<GuardianResponse> getCompanyGuardian(@PathVariable Long guardianId) {
        return ApiResponse.success(guardianService.getCompanyGuardian(guardianId));
    }

    @PostMapping("/company/guardians")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GuardianResponse> createCompanyGuardian(@Valid @RequestBody GuardianUpsertRequest request) {
        return ApiResponse.success(guardianService.createCompanyGuardian(request));
    }

    @PutMapping("/company/guardians/{guardianId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<GuardianResponse> updateCompanyGuardian(@PathVariable Long guardianId,
            @Valid @RequestBody GuardianUpsertRequest request) {
        return ApiResponse.success(guardianService.updateCompanyGuardian(guardianId, request));
    }

    @PostMapping("/company/guardians/{guardianId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<GuardianResponse> activateCompanyGuardian(@PathVariable Long guardianId) {
        return ApiResponse.success(guardianService.activateCompanyGuardian(guardianId));
    }

    @PostMapping("/company/guardians/{guardianId}/suspend")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<GuardianResponse> suspendCompanyGuardian(@PathVariable Long guardianId) {
        return ApiResponse.success(guardianService.suspendCompanyGuardian(guardianId));
    }

    @PostMapping("/company/guardians/{guardianId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<GuardianResponse> deactivateCompanyGuardian(@PathVariable Long guardianId) {
        return ApiResponse.success(guardianService.deactivateCompanyGuardian(guardianId));
    }
}
