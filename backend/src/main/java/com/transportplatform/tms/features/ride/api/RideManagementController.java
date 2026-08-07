package com.transportplatform.tms.features.ride.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.api.request.CancelRideRequest;
import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RideResponse;
import com.transportplatform.tms.features.ride.application.RideService;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.validation.Valid;
import java.time.LocalDate;
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
public class RideManagementController {

    private final RideService rideService;

    public RideManagementController(RideService rideService) {
        this.rideService = rideService;
    }

    @GetMapping("/company/rides")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<RideResponse>> searchCompanyRides(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) RideTripType tripType,
            @RequestParam(required = false) Long riderId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Boolean recurringOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(rideService.searchCompanyRides(
                keyword,
                status,
                serviceType,
                tripType,
                riderId,
                organizationId,
                contractId,
                fromDate,
                toDate,
                recurringOnly,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/rides/{rideId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> getCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RideResponse> createCompanyRide(@Valid @RequestBody RideUpsertRequest request) {
        return ApiResponse.success(rideService.createCompanyRide(request));
    }

    @PutMapping("/company/rides/{rideId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> updateCompanyRide(@PathVariable Long rideId,
            @Valid @RequestBody RideUpsertRequest request) {
        return ApiResponse.success(rideService.updateCompanyRide(rideId, request));
    }

    @PostMapping("/company/rides/{rideId}/request")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> requestCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.requestCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/review")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> reviewCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.reviewCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/schedule")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> scheduleCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.scheduleCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/mark-assigned")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideAssigned(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideAssigned(rideId));
    }

    @PostMapping("/company/rides/{rideId}/driver-en-route")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideDriverEnRoute(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideDriverEnRoute(rideId));
    }

    @PostMapping("/company/rides/{rideId}/arrived")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideArrived(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideArrived(rideId));
    }

    @PostMapping("/company/rides/{rideId}/picked-up")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRidePickedUp(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRidePickedUp(rideId));
    }

    @PostMapping("/company/rides/{rideId}/dropped-off")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideDroppedOff(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideDroppedOff(rideId));
    }

    @PostMapping("/company/rides/{rideId}/complete")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> completeCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.completeCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/no-show")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideNoShow(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideNoShow(rideId));
    }

    @PostMapping("/company/rides/{rideId}/missed")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideMissed(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideMissed(rideId));
    }

    @PostMapping("/company/rides/{rideId}/failed")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> markCompanyRideFailed(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.markCompanyRideFailed(rideId));
    }

    @PostMapping("/company/rides/{rideId}/cancel")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> cancelCompanyRide(@PathVariable Long rideId,
            @Valid @RequestBody CancelRideRequest request) {
        return ApiResponse.success(rideService.cancelCompanyRide(rideId, request));
    }
}
