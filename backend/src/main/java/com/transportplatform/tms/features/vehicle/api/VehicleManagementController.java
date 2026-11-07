package com.transportplatform.tms.features.vehicle.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.vehicle.api.request.VehicleUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleResponse;
import com.transportplatform.tms.features.vehicle.application.VehicleService;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
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
public class VehicleManagementController {

    private final VehicleService vehicleService;

    public VehicleManagementController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/company/vehicles")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<PageResponse<VehicleResponse>> searchCompanyVehicles(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) VehicleOwnershipType ownershipType,
            @RequestParam(required = false) String serviceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(vehicleService.searchCompanyVehicles(
                keyword,
                status,
                ownershipType,
                serviceType,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/vehicles/{vehicleId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> getCompanyVehicle(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.getCompanyVehicle(vehicleId));
    }

    @PostMapping("/company/vehicles")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VehicleResponse> createCompanyVehicle(@Valid @RequestBody VehicleUpsertRequest request) {
        return ApiResponse.success(vehicleService.createCompanyVehicle(request));
    }

    @PutMapping("/company/vehicles/{vehicleId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> updateCompanyVehicle(@PathVariable Long vehicleId,
            @Valid @RequestBody VehicleUpsertRequest request) {
        return ApiResponse.success(vehicleService.updateCompanyVehicle(vehicleId, request));
    }

    @PostMapping("/company/vehicles/{vehicleId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> activateCompanyVehicle(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.activateCompanyVehicle(vehicleId));
    }

    @PostMapping("/company/vehicles/{vehicleId}/suspend")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> suspendCompanyVehicle(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.suspendCompanyVehicle(vehicleId));
    }

    @PostMapping("/company/vehicles/{vehicleId}/maintenance")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> markCompanyVehicleMaintenance(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.markCompanyVehicleMaintenance(vehicleId));
    }

    @PostMapping("/company/vehicles/{vehicleId}/out-of-service")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> markCompanyVehicleOutOfService(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.markCompanyVehicleOutOfService(vehicleId));
    }

    @PostMapping("/company/vehicles/{vehicleId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleResponse> deactivateCompanyVehicle(@PathVariable Long vehicleId) {
        return ApiResponse.success(vehicleService.deactivateCompanyVehicle(vehicleId));
    }
}
