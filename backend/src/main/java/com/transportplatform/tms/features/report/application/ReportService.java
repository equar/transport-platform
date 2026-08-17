package com.transportplatform.tms.features.report.application;

import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.application.InvoiceSpecifications;
import com.transportplatform.tms.features.billing.application.PaymentSpecifications;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSpecifications;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;
import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import com.transportplatform.tms.features.driver.application.DriverSpecifications;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.incident.application.IncidentMapper;
import com.transportplatform.tms.features.incident.application.IncidentSpecifications;
import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.incident.domain.IncidentRepository;
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
import com.transportplatform.tms.features.report.api.response.ReportMetricResponse;
import com.transportplatform.tms.features.report.api.response.RideReportRowResponse;
import com.transportplatform.tms.features.report.api.response.RiderReportRowResponse;
import com.transportplatform.tms.features.report.api.response.RouteReportRowResponse;
import com.transportplatform.tms.features.report.api.response.VehicleReportRowResponse;
import com.transportplatform.tms.features.report.domain.ReportType;
import com.transportplatform.tms.features.ride.application.RideSpecifications;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.route.application.RouteSpecifications;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import com.transportplatform.tms.features.rider.application.RiderSpecifications;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.vehicle.application.VehicleSpecifications;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private static final List<String> EXPORT_FORMATS = List.of("CSV", "PDF");

    private final ReportAccessService reportAccessService;
    private final AuditLogService auditLogService;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RiderRepository riderRepository;
    private final RideRepository rideRepository;
    private final RouteRepository routeRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ComplianceIssueRepository complianceIssueRepository;
    private final ComplianceIssueSyncService complianceIssueSyncService;
    private final IncidentRepository incidentRepository;
    private final IncidentMapper incidentMapper;
    private final Clock clock;

    public ReportService(ReportAccessService reportAccessService,
            AuditLogService auditLogService,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            RiderRepository riderRepository,
            RideRepository rideRepository,
            RouteRepository routeRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ComplianceIssueRepository complianceIssueRepository,
            ComplianceIssueSyncService complianceIssueSyncService,
            IncidentRepository incidentRepository,
            IncidentMapper incidentMapper,
            Clock clock) {
        this.reportAccessService = reportAccessService;
        this.auditLogService = auditLogService;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.riderRepository = riderRepository;
        this.rideRepository = rideRepository;
        this.routeRepository = routeRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.complianceIssueRepository = complianceIssueRepository;
        this.complianceIssueSyncService = complianceIssueSyncService;
        this.incidentRepository = incidentRepository;
        this.incidentMapper = incidentMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ReportDefinitionResponse> listAvailableReports() {
        reportAccessService.requireCompanyAdmin();
        return definitions();
    }

    public long getAvailableReportCount() {
        return ReportType.values().length;
    }

    @Transactional
    public CompanyReportResponse<DriverReportRowResponse> runDriverReport(String keyword,
            DriverStatus status,
            DriverType driverType,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        List<Driver> drivers = driverRepository.findAll(
                DriverSpecifications.search(tenantId, keyword, status, driverType),
                Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .filter(driver -> withinRange(driver.getCreatedAt(), fromDate, toDate))
                .toList();
        List<DriverReportRowResponse> rows = drivers.stream()
                .map(driver -> new DriverReportRowResponse(
                        driver.getId(),
                        driver.getDriverCode(),
                        fullName(driver.getFirstName(), driver.getLastName()),
                        driver.getStatus(),
                        driver.getDriverType(),
                        driver.getPhone(),
                        driver.getEmail(),
                        driver.getLicenseExpiryDate(),
                        driver.getTrainingStatus(),
                        driver.getCreatedAt()))
                .toList();
        auditReportRun(tenantId, ReportType.DRIVER, rows.size());
        return response(ReportType.DRIVER, "Driver Report", List.of(
                metric("totalDrivers", "Total Drivers", rows.size()),
                metric("activeDrivers", "Active Drivers",
                        drivers.stream().filter(item -> item.getStatus() == DriverStatus.ACTIVE).count()),
                metric("suspendedDrivers", "Suspended Drivers",
                        drivers.stream().filter(item -> item.getStatus() == DriverStatus.SUSPENDED).count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<VehicleReportRowResponse> runVehicleReport(String keyword,
            VehicleStatus status,
            VehicleOwnershipType ownershipType,
            String serviceType,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        List<Vehicle> vehicles = vehicleRepository.findAll(
                VehicleSpecifications.search(tenantId, keyword, status, ownershipType, serviceType),
                Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .filter(vehicle -> withinRange(vehicle.getCreatedAt(), fromDate, toDate))
                .toList();
        List<VehicleReportRowResponse> rows = vehicles.stream()
                .map(vehicle -> new VehicleReportRowResponse(
                        vehicle.getId(),
                        vehicle.getVehicleCode(),
                        vehicle.getYear() + " " + vehicle.getMake() + " " + vehicle.getModel(),
                        vehicle.getStatus(),
                        vehicle.getOwnershipType(),
                        vehicle.getCapacity(),
                        vehicle.getPlateNumber(),
                        vehicle.getInsuranceExpiryDate(),
                        vehicle.getRegistrationExpiryDate(),
                        vehicle.getInspectionExpiryDate(),
                        vehicle.getCreatedAt()))
                .toList();
        auditReportRun(tenantId, ReportType.VEHICLE, rows.size());
        return response(ReportType.VEHICLE, "Vehicle Report", List.of(
                metric("totalVehicles", "Total Vehicles", rows.size()),
                metric("activeVehicles", "Active Vehicles",
                        vehicles.stream().filter(item -> item.getStatus() == VehicleStatus.ACTIVE).count()),
                metric("vehiclesInMaintenance", "Vehicles In Maintenance",
                        vehicles.stream().filter(item -> item.getStatus() == VehicleStatus.MAINTENANCE).count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<RiderReportRowResponse> runRiderReport(String keyword,
            RiderStatus status,
            RiderType riderType,
            Long organizationId,
            Boolean wheelchairRequired,
            Boolean escortRequired,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        List<Rider> riders = riderRepository.findAll(
                RiderSpecifications.search(tenantId, keyword, status, riderType, wheelchairRequired, escortRequired),
                Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .filter(rider -> organizationId == null || organizationId.equals(rider.getOrganizationId()))
                .filter(rider -> withinRange(rider.getCreatedAt(), fromDate, toDate))
                .toList();
        List<RiderReportRowResponse> rows = riders.stream()
                .map(rider -> new RiderReportRowResponse(
                        rider.getId(),
                        rider.getRiderCode(),
                        fullName(rider.getFirstName(), rider.getLastName()),
                        rider.getStatus(),
                        rider.getRiderType(),
                        rider.getOrganizationId(),
                        rider.isWheelchairRequired(),
                        rider.isEscortRequired(),
                        rider.getCreatedAt()))
                .toList();
        auditReportRun(tenantId, ReportType.RIDER, rows.size());
        return response(ReportType.RIDER, "Rider Report", List.of(
                metric("totalRiders", "Total Riders", rows.size()),
                metric("activeRiders", "Active Riders",
                        riders.stream().filter(item -> item.getStatus() == RiderStatus.ACTIVE).count()),
                metric("wheelchairSupport", "Wheelchair Support Riders",
                        riders.stream().filter(Rider::isWheelchairRequired).count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<RideReportRowResponse> runRideReport(String keyword,
            RideStatus status,
            ServiceType serviceType,
            Long riderId,
            Long organizationId,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        Map<Long, Driver> driversById = indexDrivers(tenantId);
        Map<Long, Vehicle> vehiclesById = indexVehicles(tenantId);
        List<Ride> rides = rideRepository.findAll(
                RideSpecifications.search(
                        tenantId,
                        keyword,
                        status,
                        serviceType,
                        null,
                        riderId,
                        organizationId,
                        null,
                        fromDate == null ? null : fromDate.atStartOfDay(),
                        toDate == null ? null : LocalDateTime.of(toDate, java.time.LocalTime.MAX),
                        null),
                Sort.by(Sort.Direction.DESC, "scheduledPickupAt"));
        List<RideReportRowResponse> rows = rides.stream()
                .map(ride -> new RideReportRowResponse(
                        ride.getId(),
                        ride.getRideNumber(),
                        ride.getStatus(),
                        ride.getServiceType(),
                        ride.getTripType(),
                        ride.getScheduledPickupAt(),
                        ride.getRider().getRiderCode(),
                        fullName(ride.getRider().getFirstName(), ride.getRider().getLastName()),
                        ride.getDriverId() == null ? null
                                : driversById.get(ride.getDriverId()) == null ? null
                                        : driversById.get(ride.getDriverId()).getDriverCode(),
                        ride.getVehicleId() == null ? null
                                : vehiclesById.get(ride.getVehicleId()) == null ? null
                                        : vehiclesById.get(ride.getVehicleId()).getVehicleCode(),
                        ride.getOrganization() == null ? null : ride.getOrganization().getName()))
                .toList();
        auditReportRun(tenantId, ReportType.RIDE, rows.size());
        return response(ReportType.RIDE, "Ride Report", List.of(
                metric("totalRides", "Total Rides", rows.size()),
                metric("completedRides", "Completed Rides",
                        rides.stream().filter(item -> item.getStatus() == RideStatus.COMPLETED).count()),
                metric("exceptions", "Ride Exceptions",
                        rides.stream()
                                .filter(item -> Set.of(RideStatus.RIDER_NO_SHOW, RideStatus.MISSED, RideStatus.FAILED)
                                        .contains(item.getStatus()))
                                .count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<RouteReportRowResponse> runRouteReport(String keyword,
            RouteStatus status,
            ServiceType serviceType,
            Long driverId,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        Map<Long, Driver> driversById = indexDrivers(tenantId);
        Map<Long, Vehicle> vehiclesById = indexVehicles(tenantId);
        List<Route> routes = routeRepository.findAll(
                RouteSpecifications.search(tenantId, keyword, status, serviceType, fromDate, toDate, driverId),
                Sort.by(Sort.Direction.DESC, "routeDate"));
        List<RouteReportRowResponse> rows = routes.stream()
                .map(route -> new RouteReportRowResponse(
                        route.getId(),
                        route.getRouteCode(),
                        route.getRouteName(),
                        route.getStatus(),
                        route.getServiceType(),
                        route.getRouteDate(),
                        route.getAssignedDriverId() == null ? null
                                : driversById.get(route.getAssignedDriverId()) == null ? null
                                        : driversById.get(route.getAssignedDriverId()).getDriverCode(),
                        route.getAssignedVehicleId() == null ? null
                                : vehiclesById.get(route.getAssignedVehicleId()) == null ? null
                                        : vehiclesById.get(route.getAssignedVehicleId()).getVehicleCode()))
                .toList();
        auditReportRun(tenantId, ReportType.ROUTE, rows.size());
        return response(ReportType.ROUTE, "Route Report", List.of(
                metric("totalRoutes", "Total Routes", rows.size()),
                metric("readyRoutes", "Ready Routes",
                        routes.stream().filter(item -> item.getStatus() == RouteStatus.READY).count()),
                metric("routesInProgress", "Routes In Progress",
                        routes.stream().filter(item -> item.getStatus() == RouteStatus.IN_PROGRESS).count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<InvoiceReportRowResponse> runInvoiceReport(String keyword,
            InvoiceStatus status,
            BillToType billToType,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean overdueOnly) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        LocalDate today = LocalDate.now(clock);
        List<Invoice> invoices = invoiceRepository.findAll(
                InvoiceSpecifications.search(tenantId, keyword, status, null, billToType, fromDate, toDate, overdueOnly,
                        today),
                Sort.by(Sort.Direction.DESC, "invoiceDate"));
        List<InvoiceReportRowResponse> rows = invoices.stream()
                .map(invoice -> new InvoiceReportRowResponse(
                        invoice.getId(),
                        invoice.getInvoiceNumber(),
                        invoice.getStatus(),
                        invoice.getBillToType(),
                        invoice.getBillToNameSnapshot(),
                        invoice.getInvoiceDate(),
                        invoice.getDueDate(),
                        invoice.getTotalAmount(),
                        invoice.getAmountPaid(),
                        invoice.getBalanceDue(),
                        invoice.getCurrency()))
                .toList();
        auditReportRun(tenantId, ReportType.INVOICE, rows.size());
        return response(ReportType.INVOICE, "Invoice Report", List.of(
                metric("totalBilled", "Total Billed", sum(invoices.stream().map(Invoice::getTotalAmount).toList())),
                metric("totalPaid", "Total Paid", sum(invoices.stream().map(Invoice::getAmountPaid).toList())),
                metric("outstandingBalance", "Outstanding Balance",
                        sum(invoices.stream().map(Invoice::getBalanceDue).toList()))),
                rows);
    }

    @Transactional
    public CompanyReportResponse<PaymentReportRowResponse> runPaymentReport(String keyword,
            PaymentStatus status,
            PaymentMethod paymentMethod,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        List<Payment> payments = paymentRepository.findAll(
                PaymentSpecifications.search(tenantId, keyword, status, paymentMethod, fromDate, toDate),
                Sort.by(Sort.Direction.DESC, "paymentDate"));
        List<PaymentReportRowResponse> rows = payments.stream()
                .map(payment -> new PaymentReportRowResponse(
                        payment.getId(),
                        payment.getPaymentNumber(),
                        payment.getStatus(),
                        payment.getPaymentMethod(),
                        payment.getPaymentDate(),
                        payment.getAmount(),
                        payment.getInvoice().getInvoiceNumber(),
                        payment.getPayerName(),
                        payment.getReferenceNumber()))
                .toList();
        auditReportRun(tenantId, ReportType.PAYMENT, rows.size());
        return response(ReportType.PAYMENT, "Payment Report", List.of(
                metric("totalPayments", "Payments Recorded", rows.size()),
                metric("successfulPayments", "Successful Payments",
                        payments.stream()
                                .filter(item -> item.getStatus() == PaymentStatus.RECORDED
                                        || item.getStatus() == PaymentStatus.APPLIED
                                        || item.getStatus() == PaymentStatus.PARTIALLY_APPLIED)
                                .count()),
                metric("totalAmount", "Total Amount", sum(payments.stream().map(Payment::getAmount).toList()))), rows);
    }

    @Transactional
    public CompanyReportResponse<ComplianceIssueReportRowResponse> runComplianceReport(String keyword,
            ComplianceEntityType entityType,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            ComplianceIssueStatus issueStatus,
            Boolean expiredOnly,
            Boolean expiringSoonOnly,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        LocalDate today = LocalDate.now(clock);
        complianceIssueSyncService.synchronizeTenantIssues(tenantId);
        List<ComplianceIssue> issues = complianceIssueRepository.findAll(
                ComplianceIssueSpecifications.search(
                        tenantId,
                        keyword,
                        entityType,
                        issueType,
                        severity,
                        issueStatus,
                        expiredOnly,
                        expiringSoonOnly,
                        fromDate,
                        toDate,
                        today,
                        today.plusDays(30)),
                Sort.by(Sort.Direction.DESC, "updatedAt"));
        List<ComplianceIssueReportRowResponse> rows = issues.stream()
                .map(issue -> new ComplianceIssueReportRowResponse(
                        issue.getId(),
                        issue.getEntityType(),
                        issue.getEntityCode(),
                        issue.getEntityNameSummary(),
                        issue.getIssueType(),
                        issue.getSeverity(),
                        issue.getIssueStatus(),
                        issue.getRelatedDocumentType(),
                        issue.getExpiryDate(),
                        issue.getUpdatedAt()))
                .toList();
        auditReportRun(tenantId, ReportType.COMPLIANCE, rows.size());
        return response(ReportType.COMPLIANCE, "Compliance Report", List.of(
                metric("openIssues", "Open Issues",
                        issues.stream().filter(item -> item.getIssueStatus() == ComplianceIssueStatus.OPEN).count()),
                metric("criticalIssues", "Critical Issues",
                        issues.stream().filter(item -> item.getSeverity() == ComplianceIssueSeverity.CRITICAL).count()),
                metric("expiredDocuments", "Expired Documents", issues.stream()
                        .filter(item -> item.getIssueType() == ComplianceIssueType.EXPIRED_DOCUMENT).count())),
                rows);
    }

    @Transactional
    public CompanyReportResponse<IncidentReportRowResponse> runIncidentReport(String keyword,
            IncidentType incidentType,
            IncidentSeverity severity,
            IncidentStatus status,
            Long assignedToUserId,
            LocalDate fromDate,
            LocalDate toDate) {
        String tenantId = reportAccessService.requireCompanyAdmin().tenantId();
        List<Incident> incidents = incidentRepository.findAll(
                IncidentSpecifications.search(
                        tenantId,
                        keyword,
                        status,
                        severity,
                        incidentType,
                        assignedToUserId,
                        fromDate == null ? null : fromDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                        toDate == null ? null : toDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)),
                Sort.by(Sort.Direction.DESC, "reportedAt"));
        List<IncidentReportRowResponse> rows = incidents.stream()
                .map(incident -> {
                    var detail = incidentMapper.toDetail(incident);
                    return new IncidentReportRowResponse(
                            incident.getId(),
                            incident.getIncidentCode(),
                            incident.getIncidentType(),
                            incident.getSeverity(),
                            incident.getStatus(),
                            incident.getTitle(),
                            incident.getReportedAt(),
                            detail.assignedToName(),
                            detail.relatedRideCode(),
                            detail.relatedDriverCode(),
                            detail.relatedVehicleCode(),
                            incident.getUpdatedAt());
                })
                .toList();
        auditReportRun(tenantId, ReportType.INCIDENT, rows.size());
        return response(ReportType.INCIDENT, "Incident Report", List.of(
                metric("openIncidents", "Open Incidents", incidents.stream()
                        .filter(item -> Set.of(IncidentStatus.OPEN, IncidentStatus.IN_REVIEW, IncidentStatus.ESCALATED)
                                .contains(item.getStatus()))
                        .count()),
                metric("criticalIncidents", "Critical Incidents",
                        incidents.stream().filter(item -> item.getSeverity() == IncidentSeverity.CRITICAL).count()),
                metric("resolvedIncidents", "Resolved Incidents",
                        incidents.stream().filter(item -> item.getStatus() == IncidentStatus.RESOLVED).count())),
                rows);
    }

    private List<ReportDefinitionResponse> definitions() {
        return List.of(
                new ReportDefinitionResponse(ReportType.DRIVER, "Driver Report",
                        "Operational view of tenant drivers, statuses, and readiness.",
                        List.of("keyword", "status", "driverType", "dateRange"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.VEHICLE, "Vehicle Report",
                        "Fleet status, ownership, and key compliance dates.",
                        List.of("keyword", "status", "ownershipType", "serviceType", "dateRange"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.RIDER, "Rider Report",
                        "Rider population and support-profile visibility.",
                        List.of("keyword", "status", "riderType", "organization", "dateRange"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.RIDE, "Ride Report",
                        "Ride lifecycle and service-delivery results.",
                        List.of("keyword", "status", "serviceType", "rider", "organization", "dateRange"),
                        EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.ROUTE, "Route Report",
                        "Manifest and route execution status by service day.",
                        List.of("keyword", "status", "serviceType", "driver", "dateRange"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.INVOICE, "Invoice Report",
                        "Billed, paid, and outstanding invoice exposure.",
                        List.of("keyword", "status", "billToType", "dateRange", "overdueOnly"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.PAYMENT, "Payment Report",
                        "Payment volume, methods, and invoice application traceability.",
                        List.of("keyword", "status", "paymentMethod", "dateRange"), EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.COMPLIANCE, "Compliance Report",
                        "Open issue severity, expiry pressure, and exception detail.",
                        List.of("keyword", "entityType", "issueType", "severity", "status", "dateRange"),
                        EXPORT_FORMATS),
                new ReportDefinitionResponse(ReportType.INCIDENT, "Incident Report",
                        "Incident severity, workflow state, and operational follow-up.",
                        List.of("keyword", "incidentType", "severity", "status", "assignedTo", "dateRange"),
                        EXPORT_FORMATS));
    }

    private <T> CompanyReportResponse<T> response(ReportType reportType,
            String title,
            List<ReportMetricResponse> summary,
            List<T> rows) {
        return new CompanyReportResponse<>(reportType, title, Instant.now(clock), EXPORT_FORMATS, summary, rows.size(),
                rows);
    }

    private void auditReportRun(String tenantId, ReportType reportType, long rowCount) {
        auditLogService.record(new AuditLogCommand(
                null,
                tenantId,
                "REPORT",
                "RUN",
                "REPORT",
                reportType.name(),
                reportType.name() + " report was run.",
                null,
                Map.of("rowCount", rowCount)));
    }

    private Map<Long, Driver> indexDrivers(String tenantId) {
        return driverRepository.findAllByTenantId(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(Driver::getId, item -> item, (left, right) -> left,
                        LinkedHashMap::new));
    }

    private Map<Long, Vehicle> indexVehicles(String tenantId) {
        return vehicleRepository.findAllByTenantId(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(Vehicle::getId, item -> item, (left, right) -> left,
                        LinkedHashMap::new));
    }

    private boolean withinRange(Instant createdAt, LocalDate fromDate, LocalDate toDate) {
        if (createdAt == null) {
            return true;
        }
        LocalDate value = createdAt.atZone(ZoneOffset.UTC).toLocalDate();
        if (fromDate != null && value.isBefore(fromDate)) {
            return false;
        }
        if (toDate != null && value.isAfter(toDate)) {
            return false;
        }
        return true;
    }

    private ReportMetricResponse metric(String key, String label, long value) {
        return new ReportMetricResponse(key, label, Long.toString(value));
    }

    private ReportMetricResponse metric(String key, String label, BigDecimal value) {
        return new ReportMetricResponse(key, label,
                value == null ? "0.00" : value.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
    }

    private BigDecimal sum(Collection<BigDecimal> values) {
        return values.stream().filter(java.util.Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String fullName(String firstName, String lastName) {
        return java.util.stream.Stream.of(firstName, lastName)
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse("Unknown");
    }
}
