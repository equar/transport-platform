package com.transportplatform.tms.features.dispatch.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.dispatch.api.request.AssignRideDriverRequest;
import com.transportplatform.tms.features.dispatch.api.request.AssignRideResourcesRequest;
import com.transportplatform.tms.features.dispatch.api.request.AssignRideVehicleRequest;
import com.transportplatform.tms.features.dispatch.api.response.DispatchBoardSummaryResponse;
import com.transportplatform.tms.features.dispatch.api.response.DispatchRideMapResponse;
import com.transportplatform.tms.features.dispatch.api.response.DispatchRideSummaryResponse;
import com.transportplatform.tms.features.dispatch.application.DispatchRideView;
import com.transportplatform.tms.features.dispatch.application.DispatchService;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.application.RideService;
import com.transportplatform.tms.features.ride.api.response.RideResponse;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DispatchManagementController {

    private final DispatchService dispatchService;
    private final RideService rideService;

    public DispatchManagementController(DispatchService dispatchService, RideService rideService) {
        this.dispatchService = dispatchService;
        this.rideService = rideService;
    }

    @GetMapping("/company/dispatch/rides")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<DispatchRideSummaryResponse>> searchCompanyDispatchBoard(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "ALL") DispatchRideView view,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledPickupAt") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction sortDirection) {
        return ApiResponse.success(dispatchService.searchCompanyDispatchBoard(
                keyword,
                view,
                status,
                serviceType,
                driverId,
                vehicleId,
                organizationId,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/dispatch/summary")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<DispatchBoardSummaryResponse> getCompanyDispatchBoardSummary(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(dispatchService.getCompanyDispatchBoardSummary(
                keyword,
                status,
                serviceType,
                driverId,
                vehicleId,
                organizationId,
                fromDate,
                toDate));
    }

    @GetMapping("/company/dispatch/map")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<java.util.List<DispatchRideMapResponse>> getCompanyDispatchMap(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(dispatchService.getCompanyDispatchMap(
                keyword,
                status,
                serviceType,
                driverId,
                vehicleId,
                organizationId,
                fromDate,
                toDate));
    }

    @PostMapping("/company/rides/{rideId}/assign-driver")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> assignCompanyRideDriver(@PathVariable Long rideId,
            @Valid @RequestBody AssignRideDriverRequest request) {
        dispatchService.assignRideDriver(rideId, request.driverId());
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/assign-vehicle")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> assignCompanyRideVehicle(@PathVariable Long rideId,
            @Valid @RequestBody AssignRideVehicleRequest request) {
        dispatchService.assignRideVehicle(rideId, request.vehicleId());
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/assign-resources")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> assignCompanyRideResources(@PathVariable Long rideId,
            @Valid @RequestBody AssignRideResourcesRequest request) {
        dispatchService.assignRideResources(rideId, request.driverId(), request.vehicleId());
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/unassign-driver")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> unassignCompanyRideDriver(@PathVariable Long rideId) {
        dispatchService.unassignRideDriver(rideId);
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/unassign-vehicle")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> unassignCompanyRideVehicle(@PathVariable Long rideId) {
        dispatchService.unassignRideVehicle(rideId);
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }
}
