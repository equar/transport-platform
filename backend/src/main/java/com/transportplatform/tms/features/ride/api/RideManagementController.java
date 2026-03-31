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
    @PreAuthorize("hasRole('TENANT_ADMIN')")
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
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> getCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }

    @PostMapping("/company/rides")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RideResponse> createCompanyRide(@Valid @RequestBody RideUpsertRequest request) {
        return ApiResponse.success(rideService.createCompanyRide(request));
    }

    @PutMapping("/company/rides/{rideId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> updateCompanyRide(@PathVariable Long rideId,
            @Valid @RequestBody RideUpsertRequest request) {
        return ApiResponse.success(rideService.updateCompanyRide(rideId, request));
    }

    @PostMapping("/company/rides/{rideId}/request")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> requestCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.requestCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/review")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> reviewCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.reviewCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/schedule")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> scheduleCompanyRide(@PathVariable Long rideId) {
        return ApiResponse.success(rideService.scheduleCompanyRide(rideId));
    }

    @PostMapping("/company/rides/{rideId}/cancel")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<RideResponse> cancelCompanyRide(@PathVariable Long rideId,
            @Valid @RequestBody CancelRideRequest request) {
        return ApiResponse.success(rideService.cancelCompanyRide(rideId, request));
    }
}