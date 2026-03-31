package com.transportplatform.tms.features.report.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.report.api.response.ComplianceIssueReportRowResponse;
import com.transportplatform.tms.features.report.api.response.CompanyReportResponse;
import com.transportplatform.tms.features.report.api.response.DriverReportRowResponse;
import com.transportplatform.tms.features.report.api.response.IncidentReportRowResponse;
import com.transportplatform.tms.features.report.api.response.InvoiceReportRowResponse;
import com.transportplatform.tms.features.report.api.response.PaymentReportRowResponse;
import com.transportplatform.tms.features.report.api.response.ReportDefinitionResponse;
import com.transportplatform.tms.features.report.api.response.RideReportRowResponse;
import com.transportplatform.tms.features.report.api.response.RiderReportRowResponse;
import com.transportplatform.tms.features.report.api.response.RouteReportRowResponse;
import com.transportplatform.tms.features.report.api.response.VehicleReportRowResponse;
import com.transportplatform.tms.features.report.application.ReportService;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CompanyReportController {

    private final ReportService reportService;

    public CompanyReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/company/reports")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<ReportDefinitionResponse>> listReports() {
        return ApiResponse.success(reportService.listAvailableReports());
    }

    @GetMapping("/company/reports/drivers")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<DriverReportRowResponse>> getDriverReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) DriverStatus status,
            @RequestParam(required = false) DriverType driverType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(reportService.runDriverReport(keyword, status, driverType, fromDate, toDate));
    }

    @GetMapping("/company/reports/vehicles")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<VehicleReportRowResponse>> getVehicleReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) VehicleOwnershipType ownershipType,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse
                .success(reportService.runVehicleReport(keyword, status, ownershipType, serviceType, fromDate, toDate));
    }

    @GetMapping("/company/reports/riders")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<RiderReportRowResponse>> getRiderReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RiderStatus status,
            @RequestParam(required = false) RiderType riderType,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Boolean wheelchairRequired,
            @RequestParam(required = false) Boolean escortRequired,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(reportService.runRiderReport(keyword, status, riderType, organizationId,
                wheelchairRequired, escortRequired, fromDate, toDate));
    }

    @GetMapping("/company/reports/rides")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<RideReportRowResponse>> getRideReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long riderId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(
                reportService.runRideReport(keyword, status, serviceType, riderId, organizationId, fromDate, toDate));
    }

    @GetMapping("/company/reports/routes")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<RouteReportRowResponse>> getRouteReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RouteStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse
                .success(reportService.runRouteReport(keyword, status, serviceType, driverId, fromDate, toDate));
    }

    @GetMapping("/company/reports/invoices")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<InvoiceReportRowResponse>> getInvoiceReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) BillToType billToType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Boolean overdueOnly) {
        return ApiResponse
                .success(reportService.runInvoiceReport(keyword, status, billToType, fromDate, toDate, overdueOnly));
    }

    @GetMapping("/company/reports/payments")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<PaymentReportRowResponse>> getPaymentReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(reportService.runPaymentReport(keyword, status, paymentMethod, fromDate, toDate));
    }

    @GetMapping("/company/reports/compliance")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<ComplianceIssueReportRowResponse>> getComplianceReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ComplianceEntityType entityType,
            @RequestParam(required = false) ComplianceIssueType issueType,
            @RequestParam(required = false) ComplianceIssueSeverity severity,
            @RequestParam(required = false) ComplianceIssueStatus issueStatus,
            @RequestParam(required = false) Boolean expiredOnly,
            @RequestParam(required = false) Boolean expiringSoonOnly,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(reportService.runComplianceReport(keyword, entityType, issueType, severity,
                issueStatus, expiredOnly, expiringSoonOnly, fromDate, toDate));
    }

    @GetMapping("/company/reports/incidents")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanyReportResponse<IncidentReportRowResponse>> getIncidentReport(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) IncidentType incidentType,
            @RequestParam(required = false) IncidentSeverity severity,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Long assignedToUserId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        return ApiResponse.success(reportService.runIncidentReport(keyword, incidentType, severity, status,
                assignedToUserId, fromDate, toDate));
    }
}