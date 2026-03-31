package com.transportplatform.tms.features.organizationportal.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.organization.api.response.ContractResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationLinkedRiderResponse;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organizationportal.api.request.OrganizationPortalProfileUpdateRequest;
import com.transportplatform.tms.features.organizationportal.api.response.OrganizationPortalDashboardResponse;
import com.transportplatform.tms.features.organizationportal.api.response.OrganizationPortalProfileResponse;
import com.transportplatform.tms.features.organizationportal.application.OrganizationPortalService;
import com.transportplatform.tms.features.portalcommon.api.response.PortalRideSummaryResponse;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('ORGANIZATION_USER')")
public class OrganizationPortalController {

    private final OrganizationPortalService service;

    public OrganizationPortalController(OrganizationPortalService service) {
        this.service = service;
    }

    @GetMapping("/portal/organization/dashboard")
    public ApiResponse<OrganizationPortalDashboardResponse> getDashboard() {
        return ApiResponse.success(service.getDashboard());
    }

    @GetMapping("/portal/organization/profile")
    public ApiResponse<OrganizationPortalProfileResponse> getProfile() {
        return ApiResponse.success(service.getProfile());
    }

    @PutMapping("/portal/organization/profile")
    public ApiResponse<OrganizationPortalProfileResponse> updateProfile(
            @Valid @RequestBody OrganizationPortalProfileUpdateRequest request) {
        return ApiResponse.success(service.updateProfile(request));
    }

    @GetMapping("/portal/organization/contacts")
    public ApiResponse<List<OrganizationContactResponse>> getContacts() {
        return ApiResponse.success(service.getContacts());
    }

    @GetMapping("/portal/organization/riders")
    public ApiResponse<PageResponse<OrganizationLinkedRiderResponse>> searchRiders(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RiderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction sortDirection) {
        return ApiResponse.success(service.searchRiders(keyword, status, page, size, sortBy, sortDirection));
    }

    @GetMapping("/portal/organization/rides")
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

    @GetMapping("/portal/organization/contracts")
    public ApiResponse<PageResponse<ContractResponse>> searchContracts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(service.searchContracts(keyword, status, page, size, sortBy, sortDirection));
    }

    @GetMapping("/portal/organization/invoices")
    public ApiResponse<PageResponse<InvoiceSummaryResponse>> searchInvoices(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "invoiceDate") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(service.searchInvoices(keyword, status, page, size, sortBy, sortDirection));
    }

    @GetMapping("/portal/organization/payments")
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