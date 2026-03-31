package com.transportplatform.tms.features.organization.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.api.request.ServiceAreaUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ServiceAreaResponse;
import com.transportplatform.tms.features.organization.application.ServiceAreaService;
import com.transportplatform.tms.features.organization.domain.ServiceAreaCoverageType;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
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
public class ServiceAreaManagementController {

    private final ServiceAreaService serviceAreaService;

    public ServiceAreaManagementController(ServiceAreaService serviceAreaService) {
        this.serviceAreaService = serviceAreaService;
    }

    @GetMapping("/company/service-areas")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<ServiceAreaResponse>> searchCompanyServiceAreas(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ServiceAreaStatus status,
            @RequestParam(required = false) ServiceAreaCoverageType coverageType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(serviceAreaService.searchCompanyServiceAreas(
                keyword,
                status,
                coverageType,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/service-areas/{serviceAreaId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ServiceAreaResponse> getCompanyServiceArea(@PathVariable Long serviceAreaId) {
        return ApiResponse.success(serviceAreaService.getCompanyServiceArea(serviceAreaId));
    }

    @PostMapping("/company/service-areas")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ServiceAreaResponse> createCompanyServiceArea(
            @Valid @RequestBody ServiceAreaUpsertRequest request) {
        return ApiResponse.success(serviceAreaService.createCompanyServiceArea(request));
    }

    @PutMapping("/company/service-areas/{serviceAreaId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ServiceAreaResponse> updateCompanyServiceArea(@PathVariable Long serviceAreaId,
            @Valid @RequestBody ServiceAreaUpsertRequest request) {
        return ApiResponse.success(serviceAreaService.updateCompanyServiceArea(serviceAreaId, request));
    }

    @PostMapping("/company/service-areas/{serviceAreaId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ServiceAreaResponse> activateCompanyServiceArea(@PathVariable Long serviceAreaId) {
        return ApiResponse.success(serviceAreaService.activateCompanyServiceArea(serviceAreaId));
    }

    @PostMapping("/company/service-areas/{serviceAreaId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ServiceAreaResponse> deactivateCompanyServiceArea(@PathVariable Long serviceAreaId) {
        return ApiResponse.success(serviceAreaService.deactivateCompanyServiceArea(serviceAreaId));
    }
}