package com.transportplatform.tms.features.rider.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.rider.api.request.RiderUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.RiderResponse;
import com.transportplatform.tms.features.rider.application.RiderService;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
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
public class RiderManagementController {

    private final RiderService riderService;

    public RiderManagementController(RiderService riderService) {
        this.riderService = riderService;
    }

    @GetMapping("/company/riders")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<RiderResponse>> searchCompanyRiders(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RiderStatus status,
            @RequestParam(required = false) RiderType riderType,
            @RequestParam(required = false) Boolean wheelchairRequired,
            @RequestParam(required = false) Boolean escortRequired,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(riderService.searchCompanyRiders(
                keyword,
                status,
                riderType,
                wheelchairRequired,
                escortRequired,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/riders/{riderId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> getCompanyRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderService.getCompanyRider(riderId));
    }

    @PostMapping("/company/riders")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RiderResponse> createCompanyRider(@Valid @RequestBody RiderUpsertRequest request) {
        return ApiResponse.success(riderService.createCompanyRider(request));
    }

    @PutMapping("/company/riders/{riderId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> updateCompanyRider(@PathVariable Long riderId,
            @Valid @RequestBody RiderUpsertRequest request) {
        return ApiResponse.success(riderService.updateCompanyRider(riderId, request));
    }

    @PostMapping("/company/riders/{riderId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> activateCompanyRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderService.activateCompanyRider(riderId));
    }

    @PostMapping("/company/riders/{riderId}/suspend")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> suspendCompanyRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderService.suspendCompanyRider(riderId));
    }

    @PostMapping("/company/riders/{riderId}/waitlist")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> waitlistCompanyRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderService.waitlistCompanyRider(riderId));
    }

    @PostMapping("/company/riders/{riderId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderResponse> deactivateCompanyRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderService.deactivateCompanyRider(riderId));
    }
}
