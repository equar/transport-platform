package com.transportplatform.tms.features.riderguardianportal.api;

import java.time.LocalDate;
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

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.location.api.response.DriverLocationSnapshotResponse;
import com.transportplatform.tms.features.portalcommon.api.response.PortalRideSummaryResponse;
import com.transportplatform.tms.features.ride.api.request.CancelRideRequest;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.riderguardianportal.api.request.RiderGuardianPortalProfileUpdateRequest;
import com.transportplatform.tms.features.riderguardianportal.api.request.RiderGuardianPortalRideCreateRequest;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalDashboardResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalLinkedRiderResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalProfileResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalRideDetailResponse;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalService;

import jakarta.validation.Valid;

@RestController
@PreAuthorize("hasAnyRole('RIDER','GUARDIAN')")
public class RiderGuardianPortalController {

    private final RiderGuardianPortalService service;

    public RiderGuardianPortalController(RiderGuardianPortalService service) {
        this.service = service;
    }

    @GetMapping("/portal/rider/dashboard")
    public ApiResponse<RiderGuardianPortalDashboardResponse> getDashboard() {
        return ApiResponse.success(service.getDashboard());
    }

    @GetMapping("/portal/rider/profile")
    public ApiResponse<RiderGuardianPortalProfileResponse> getProfile() {
        return ApiResponse.success(service.getProfile());
    }

    @PutMapping("/portal/rider/profile")
    public ApiResponse<RiderGuardianPortalProfileResponse> updateProfile(
            @Valid @RequestBody RiderGuardianPortalProfileUpdateRequest request) {
        return ApiResponse.success(service.updateProfile(request));
    }

    @GetMapping("/portal/rider/linked-riders")
    public ApiResponse<List<RiderGuardianPortalLinkedRiderResponse>> getLinkedRiders() {
        return ApiResponse.success(service.getLinkedRiders());
    }

    @GetMapping("/portal/rider/rides")
    public ApiResponse<PageResponse<PortalRideSummaryResponse>> searchRides(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledPickupAt") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction sortDirection) {
        return ApiResponse
                .success(service.searchRides(keyword, status, fromDate, toDate, page, size, sortBy, sortDirection));
    }

    @GetMapping("/portal/rider/rides/{rideId}")
    public ApiResponse<RiderGuardianPortalRideDetailResponse> getRide(@PathVariable Long rideId) {
        return ApiResponse.success(service.getRide(rideId));
    }

    @PostMapping("/portal/rider/rides")
    @PreAuthorize("hasRole('RIDER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RiderGuardianPortalRideDetailResponse> createRide(
            @Valid @RequestBody RiderGuardianPortalRideCreateRequest request) {
        return ApiResponse.success(service.createRide(request));
    }

    @PostMapping("/portal/rider/rides/{rideId}/cancel")
    @PreAuthorize("hasRole('RIDER')")
    public ApiResponse<RiderGuardianPortalRideDetailResponse> cancelRide(@PathVariable Long rideId,
            @Valid @RequestBody CancelRideRequest request) {
        return ApiResponse.success(service.cancelRide(rideId, request));
    }

    @GetMapping("/portal/rider/rides/{rideId}/location-snapshot")
    public ApiResponse<DriverLocationSnapshotResponse> getRideLocationSnapshot(@PathVariable Long rideId) {
        return ApiResponse.success(service.getRideLocationSnapshot(rideId));
    }

    @GetMapping("/portal/rider/invoices")
    public ApiResponse<PageResponse<InvoiceSummaryResponse>> searchInvoices(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "invoiceDate") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(service.searchInvoices(keyword, status, page, size, sortBy, sortDirection));
    }

    @GetMapping("/portal/rider/payments")
    public ApiResponse<PageResponse<PaymentSummaryResponse>> searchPayments(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(service.searchPayments(keyword, status, page, size, sortBy, sortDirection));
    }
}
