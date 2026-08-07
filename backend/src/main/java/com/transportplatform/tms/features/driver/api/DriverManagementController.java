package com.transportplatform.tms.features.driver.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.driver.api.request.DriverUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverResponse;
import com.transportplatform.tms.features.driver.application.DriverService;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
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
public class DriverManagementController {

    private final DriverService driverService;

    public DriverManagementController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping("/company/drivers")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<PageResponse<DriverResponse>> searchCompanyDrivers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) DriverStatus status,
            @RequestParam(required = false) DriverType driverType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(driverService.searchCompanyDrivers(
                keyword,
                status,
                driverType,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/drivers/{driverId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> getCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.getCompanyDriver(driverId));
    }

    @PostMapping("/company/drivers")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DriverResponse> createCompanyDriver(@Valid @RequestBody DriverUpsertRequest request) {
        return ApiResponse.success(driverService.createCompanyDriver(request));
    }

    @PutMapping("/company/drivers/{driverId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> updateCompanyDriver(@PathVariable Long driverId,
            @Valid @RequestBody DriverUpsertRequest request) {
        return ApiResponse.success(driverService.updateCompanyDriver(driverId, request));
    }

    @PostMapping("/company/drivers/{driverId}/review")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> reviewCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.reviewCompanyDriver(driverId));
    }

    @PostMapping("/company/drivers/{driverId}/documents-complete")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> completeCompanyDriverDocuments(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.completeCompanyDriverDocuments(driverId));
    }

    @PostMapping("/company/drivers/{driverId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> activateCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.activateCompanyDriver(driverId));
    }

    @PostMapping("/company/drivers/{driverId}/suspend")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> suspendCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.suspendCompanyDriver(driverId));
    }

    @PostMapping("/company/drivers/{driverId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> deactivateCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.deactivateCompanyDriver(driverId));
    }

    @PostMapping("/company/drivers/{driverId}/terminate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverResponse> terminateCompanyDriver(@PathVariable Long driverId) {
        return ApiResponse.success(driverService.terminateCompanyDriver(driverId));
    }
}
