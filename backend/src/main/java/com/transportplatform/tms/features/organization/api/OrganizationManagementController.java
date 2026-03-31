package com.transportplatform.tms.features.organization.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.api.request.OrganizationUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationResponse;
import com.transportplatform.tms.features.organization.application.OrganizationService;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrganizationManagementController {

    private final OrganizationService organizationService;

    public OrganizationManagementController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/company/organizations")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<OrganizationResponse>> searchCompanyOrganizations(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) OrganizationStatus status,
            @RequestParam(required = false) OrganizationType organizationType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(organizationService.searchCompanyOrganizations(
                keyword,
                status,
                organizationType,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/organizations/options")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<OrganizationResponse>> listActiveOrganizations() {
        return ApiResponse.success(organizationService.listActiveOrganizations());
    }

    @GetMapping("/company/organizations/{organizationId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationResponse> getCompanyOrganization(@PathVariable Long organizationId) {
        return ApiResponse.success(organizationService.getCompanyOrganization(organizationId));
    }

    @PostMapping("/company/organizations")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrganizationResponse> createCompanyOrganization(
            @Valid @RequestBody OrganizationUpsertRequest request) {
        return ApiResponse.success(organizationService.createCompanyOrganization(request));
    }

    @PutMapping("/company/organizations/{organizationId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationResponse> updateCompanyOrganization(@PathVariable Long organizationId,
            @Valid @RequestBody OrganizationUpsertRequest request) {
        return ApiResponse.success(organizationService.updateCompanyOrganization(organizationId, request));
    }

    @PostMapping("/company/organizations/{organizationId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationResponse> activateCompanyOrganization(@PathVariable Long organizationId) {
        return ApiResponse.success(organizationService.activateCompanyOrganization(organizationId));
    }

    @PostMapping("/company/organizations/{organizationId}/suspend")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationResponse> suspendCompanyOrganization(@PathVariable Long organizationId) {
        return ApiResponse.success(organizationService.suspendCompanyOrganization(organizationId));
    }

    @PostMapping("/company/organizations/{organizationId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationResponse> deactivateCompanyOrganization(@PathVariable Long organizationId) {
        return ApiResponse.success(organizationService.deactivateCompanyOrganization(organizationId));
    }
}