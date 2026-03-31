package com.transportplatform.tms.features.organizationportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.application.InvoiceFinancialService;
import com.transportplatform.tms.features.billing.application.InvoiceMapper;
import com.transportplatform.tms.features.billing.application.InvoiceSpecifications;
import com.transportplatform.tms.features.billing.application.InvoiceStatusWorkflow;
import com.transportplatform.tms.features.billing.application.PaymentMapper;
import com.transportplatform.tms.features.billing.application.PaymentSpecifications;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.organization.api.response.ContractResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationLinkedRiderResponse;
import com.transportplatform.tms.features.organization.application.ContractMapper;
import com.transportplatform.tms.features.organization.application.ContractSpecifications;
import com.transportplatform.tms.features.organization.application.OrganizationContactMapper;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organizationportal.api.request.OrganizationPortalProfileUpdateRequest;
import com.transportplatform.tms.features.organizationportal.api.response.OrganizationPortalDashboardResponse;
import com.transportplatform.tms.features.organizationportal.api.response.OrganizationPortalProfileResponse;
import com.transportplatform.tms.features.portalcommon.api.response.PortalRideSummaryResponse;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationPortalService {

    private static final Set<RideStatus> UPCOMING_RIDE_STATUSES = Set.of(
            RideStatus.REQUESTED,
            RideStatus.PENDING_REVIEW,
            RideStatus.SCHEDULED,
            RideStatus.ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP,
            RideStatus.DROPPED_OFF);

    private final OrganizationPortalAccessService accessService;
    private final OrganizationContactRepository organizationContactRepository;
    private final OrganizationRepository organizationRepository;
    private final RiderRepository riderRepository;
    private final RideRepository rideRepository;
    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final OrganizationContactMapper organizationContactMapper;
    private final ContractMapper contractMapper;
    private final InvoiceMapper invoiceMapper;
    private final PaymentMapper paymentMapper;
    private final InvoiceFinancialService invoiceFinancialService;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public OrganizationPortalService(OrganizationPortalAccessService accessService,
            OrganizationContactRepository organizationContactRepository,
            OrganizationRepository organizationRepository,
            RiderRepository riderRepository,
            RideRepository rideRepository,
            ContractRepository contractRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            NotificationRepository notificationRepository,
            OrganizationContactMapper organizationContactMapper,
            ContractMapper contractMapper,
            InvoiceMapper invoiceMapper,
            PaymentMapper paymentMapper,
            InvoiceFinancialService invoiceFinancialService,
            AuditLogService auditLogService,
            Clock clock) {
        this.accessService = accessService;
        this.organizationContactRepository = organizationContactRepository;
        this.organizationRepository = organizationRepository;
        this.riderRepository = riderRepository;
        this.rideRepository = rideRepository;
        this.contractRepository = contractRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.organizationContactMapper = organizationContactMapper;
        this.contractMapper = contractMapper;
        this.invoiceMapper = invoiceMapper;
        this.paymentMapper = paymentMapper;
        this.invoiceFinancialService = invoiceFinancialService;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public OrganizationPortalDashboardResponse getDashboard() {
        var scope = accessService.resolveCurrentScope();
        Organization organization = scope.contact().getOrganization();
        long linkedRiderCount = riderRepository.countByTenantIdAndOrganizationId(scope.user().tenantId(),
                organization.getId());
        LocalDate today = LocalDate.now(clock);
        long activeContractCount = contractRepository.count((root, query, builder) -> builder.and(
                builder.equal(root.get("tenantId"), scope.user().tenantId()),
                builder.equal(root.get("organization").get("id"), organization.getId()),
                builder.equal(root.get("status"), ContractStatus.ACTIVE),
                builder.or(
                        builder.isNull(root.get("endDate")),
                        builder.greaterThanOrEqualTo(root.get("endDate"), today))));
        long upcomingRideCount = rideRepository.count((root, query, builder) -> builder.and(
                builder.equal(root.get("tenantId"), scope.user().tenantId()),
                builder.equal(root.get("organization").get("id"), organization.getId()),
                root.get("status").in(UPCOMING_RIDE_STATUSES),
                builder.greaterThanOrEqualTo(root.get("scheduledPickupAt"), LocalDateTime.now(clock))));
        var invoices = loadInvoices(scope, null, null, 0, 1000, "invoiceDate", Sort.Direction.DESC).items();
        long openInvoiceCount = invoices.stream()
                .filter(invoice -> invoice.status() == InvoiceStatus.ISSUED
                        || invoice.status() == InvoiceStatus.PARTIALLY_PAID
                        || invoice.status() == InvoiceStatus.OVERDUE)
                .count();
        BigDecimal outstandingBalance = invoices.stream().map(InvoiceSummaryResponse::balanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long unreadNotifications = notificationRepository.countByTenantIdAndRecipientUserIdAndReadStatusAndStatus(
                scope.user().tenantId(),
                scope.user().id(),
                NotificationReadStatus.UNREAD,
                NotificationStatus.ACTIVE);
        return new OrganizationPortalDashboardResponse(
                linkedRiderCount,
                activeContractCount,
                upcomingRideCount,
                openInvoiceCount,
                outstandingBalance,
                unreadNotifications);
    }

    @Transactional(readOnly = true)
    public OrganizationPortalProfileResponse getProfile() {
        return toProfileResponse(accessService.resolveCurrentScope().contact());
    }

    @Transactional
    public OrganizationPortalProfileResponse updateProfile(OrganizationPortalProfileUpdateRequest request) {
        var scope = accessService.resolveCurrentScope();
        OrganizationContact contact = scope.contact();
        Object oldSnapshot = snapshotContact(contact);
        contact.setTitle(trimToNull(request.title()));
        contact.setDepartment(trimToNull(request.department()));
        contact.setEmail(trimToNull(request.email()));
        contact.setPhone(requirePhone(request.phone()));
        contact.setAlternatePhone(trimToNull(request.alternatePhone()));
        contact.setPreferredCommunicationMethod(request.preferredCommunicationMethod());
        contact.setNotes(trimToNull(request.notes()));
        organizationContactRepository.save(contact);
        auditLogService.record(new AuditLogCommand(
                null,
                scope.user().tenantId(),
                "ORGANIZATION_PORTAL",
                "PROFILE_UPDATED",
                "ORGANIZATION_CONTACT",
                contact.getId().toString(),
                "Organization portal profile updated.",
                oldSnapshot,
                snapshotContact(contact)));
        return toProfileResponse(contact);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrganizationLinkedRiderResponse> searchRiders(String keyword,
            RiderStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var scope = accessService.resolveCurrentScope();
        Long organizationId = scope.contact().getOrganization().getId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveRiderSortField(sortBy)));
        var result = riderRepository.findAll((root, query, builder) -> {
            query.distinct(true);
            var predicate = builder.and(
                    builder.equal(root.get("tenantId"), scope.user().tenantId()),
                    builder.equal(root.get("organizationId"), organizationId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("riderCode")), pattern),
                        builder.like(builder.lower(root.get("firstName")), pattern),
                        builder.like(builder.lower(root.get("lastName")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(rider -> new OrganizationLinkedRiderResponse(
                rider.getId(),
                rider.getRiderCode(),
                displayName(rider.getFirstName(), rider.getLastName()),
                rider.getRiderType(),
                rider.getStatus(),
                rider.isWheelchairRequired(),
                rider.isEscortRequired())));
    }

    @Transactional(readOnly = true)
    public PageResponse<PortalRideSummaryResponse> searchRides(String keyword,
            RideStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var scope = accessService.resolveCurrentScope();
        Long organizationId = scope.contact().getOrganization().getId();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : LocalDateTime.of(toDate, LocalTime.MAX);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveRideSortField(sortBy)));
        var result = rideRepository.findAll((root, query, builder) -> {
            query.distinct(true);
            var predicate = builder.and(
                    builder.equal(root.get("tenantId"), scope.user().tenantId()),
                    builder.equal(root.get("organization").get("id"), organizationId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("rideNumber")), pattern),
                        builder.like(builder.lower(root.get("rider").get("firstName")), pattern),
                        builder.like(builder.lower(root.get("rider").get("lastName")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (fromDateTime != null) {
                predicate = builder.and(predicate,
                        builder.greaterThanOrEqualTo(root.get("scheduledPickupAt"), fromDateTime));
            }
            if (toDateTime != null) {
                predicate = builder.and(predicate,
                        builder.lessThanOrEqualTo(root.get("scheduledPickupAt"), toDateTime));
            }
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(this::toRideSummary));
    }

    @Transactional(readOnly = true)
    public PageResponse<ContractResponse> searchContracts(String keyword,
            ContractStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var scope = accessService.resolveCurrentScope();
        Long organizationId = scope.contact().getOrganization().getId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveContractSortField(sortBy)));
        var result = contractRepository.findAll((root, query, builder) -> {
            var predicate = ContractSpecifications.search(scope.user().tenantId(), keyword, status, null, null, today)
                    .toPredicate(root, query, builder);
            predicate = builder.and(predicate, builder.equal(root.get("organization").get("id"), organizationId));
            return predicate;
        }, pageable);
        return PageResponse.from(result
                .map(contract -> contractMapper.toResponse(contract, resolveEffectiveContractStatus(contract, today))));
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceSummaryResponse> searchInvoices(String keyword,
            InvoiceStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        return loadInvoices(accessService.resolveCurrentScope(), keyword, status, page, size, sortBy, sortDirection);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> searchPayments(String keyword,
            PaymentStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var scope = accessService.resolveCurrentScope();
        Long organizationId = scope.contact().getOrganization().getId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolvePaymentSortField(sortBy)));
        var result = paymentRepository.findAll((root, query, builder) -> {
            var predicate = PaymentSpecifications.search(scope.user().tenantId(), keyword, status, null, null, null)
                    .toPredicate(root, query, builder);
            predicate = builder.and(predicate,
                    builder.equal(root.join("invoice").get("organizationId"), organizationId));
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(payment -> paymentMapper.toSummary(payment,
                InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), today))));
    }

    @Transactional(readOnly = true)
    public java.util.List<OrganizationContactResponse> getContacts() {
        var scope = accessService.resolveCurrentScope();
        return organizationContactRepository.findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(
                scope.user().tenantId(),
                scope.contact().getOrganization().getId()).stream().map(organizationContactMapper::toResponse).toList();
    }

    private PageResponse<InvoiceSummaryResponse> loadInvoices(
            OrganizationPortalAccessService.ResolvedOrganizationPortalScope scope,
            String keyword,
            InvoiceStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        LocalDate today = LocalDate.now(clock);
        Long organizationId = scope.contact().getOrganization().getId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveInvoiceSortField(sortBy)));
        var result = invoiceRepository.findAll((root, query, builder) -> {
            var predicate = InvoiceSpecifications
                    .search(scope.user().tenantId(), keyword, status, null, null, null, null, null, today)
                    .toPredicate(root, query, builder);
            predicate = builder.and(predicate, builder.equal(root.get("organizationId"), organizationId));
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(invoice -> invoiceMapper.toSummary(
                invoice,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today),
                invoiceFinancialService.resolveDaysPastDue(invoice, today),
                invoiceFinancialService.resolveAgingBucket(invoice, today))));
    }

    private OrganizationPortalProfileResponse toProfileResponse(OrganizationContact contact) {
        Organization organization = contact.getOrganization();
        return new OrganizationPortalProfileResponse(
                contact.getId(),
                organization.getId(),
                organization.getOrganizationCode(),
                organization.getName(),
                organization.getLegalName(),
                organization.getStatus().name(),
                organization.getPrimaryPhone(),
                organization.getPrimaryEmail(),
                organization.getWebsite(),
                address(organization.getAddressLine1(), organization.getAddressLine2(), organization.getCity(),
                        organization.getState(), organization.getZipCode()),
                address(organization.getBillingAddressLine1(), organization.getBillingAddressLine2(),
                        organization.getBillingCity(), organization.getBillingState(),
                        organization.getBillingZipCode()),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getTitle(),
                contact.getDepartment(),
                contact.getEmail(),
                contact.getPhone(),
                contact.getAlternatePhone(),
                contact.getPreferredCommunicationMethod() == null ? null
                        : contact.getPreferredCommunicationMethod().name(),
                contact.isPrimary(),
                contact.getNotes(),
                contact.getStatus().name(),
                contact.getUpdatedAt());
    }

    private PortalRideSummaryResponse toRideSummary(Ride ride) {
        return new PortalRideSummaryResponse(
                ride.getId(),
                ride.getRideNumber(),
                ride.getStatus(),
                ride.getServiceType(),
                ride.getTripType(),
                ride.getScheduledPickupAt(),
                ride.getScheduledDropoffAt(),
                displayName(ride.getRider().getFirstName(), ride.getRider().getLastName()),
                ride.getGuardian() == null ? null
                        : displayName(ride.getGuardian().getFirstName(), ride.getGuardian().getLastName()),
                ride.getOrganization() == null ? null : ride.getOrganization().getName(),
                address(ride.getPickupAddressLine1(), ride.getPickupAddressLine2(), ride.getPickupCity(),
                        ride.getPickupState(), ride.getPickupZipCode()),
                address(ride.getDropoffAddressLine1(), ride.getDropoffAddressLine2(), ride.getDropoffCity(),
                        ride.getDropoffState(), ride.getDropoffZipCode()),
                ride.getRouteId());
    }

    private ContractStatus resolveEffectiveContractStatus(Contract contract, LocalDate today) {
        if ((contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.SUSPENDED)
                && contract.getEndDate() != null
                && contract.getEndDate().isBefore(today)) {
            return ContractStatus.EXPIRED;
        }
        return contract.getStatus();
    }

    private Object snapshotContact(OrganizationContact contact) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("title", contact.getTitle());
        values.put("department", contact.getDepartment());
        values.put("email", contact.getEmail());
        values.put("phone", contact.getPhone());
        values.put("alternatePhone", contact.getAlternatePhone());
        values.put("preferredCommunicationMethod", contact.getPreferredCommunicationMethod() == null ? null
                : contact.getPreferredCommunicationMethod().name());
        values.put("notes", contact.getNotes());
        return values;
    }

    private String resolveRiderSortField(String sortBy) {
        String resolved = sortBy == null ? "lastName" : sortBy;
        return switch (resolved) {
            case "riderCode", "firstName", "lastName", "status", "updatedAt", "createdAt" -> resolved;
            default -> "lastName";
        };
    }

    private String resolveRideSortField(String sortBy) {
        String resolved = sortBy == null ? "scheduledPickupAt" : sortBy;
        return switch (resolved) {
            case "scheduledPickupAt", "scheduledDropoffAt", "rideNumber", "status", "updatedAt", "createdAt" ->
                resolved;
            default -> "scheduledPickupAt";
        };
    }

    private String resolveContractSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "contractCode", "contractName", "status", "startDate", "endDate", "updatedAt", "createdAt" -> resolved;
            default -> "updatedAt";
        };
    }

    private String resolveInvoiceSortField(String sortBy) {
        String resolved = sortBy == null ? "invoiceDate" : sortBy;
        return switch (resolved) {
            case "invoiceDate", "dueDate", "invoiceNumber", "status", "balanceDue", "updatedAt", "createdAt" ->
                resolved;
            default -> "invoiceDate";
        };
    }

    private String resolvePaymentSortField(String sortBy) {
        String resolved = sortBy == null ? "paymentDate" : sortBy;
        return switch (resolved) {
            case "paymentDate", "paymentNumber", "status", "amount", "updatedAt", "createdAt" -> resolved;
            default -> "paymentDate";
        };
    }

    private String requirePhone(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "Phone is required.");
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String displayName(String firstName, String lastName) {
        String displayName = ((firstName == null ? "" : firstName.trim()) + " "
                + (lastName == null ? "" : lastName.trim())).trim();
        return displayName.isBlank() ? null : displayName;
    }

    private String address(String line1, String line2, String city, String state, String zipCode) {
        return java.util.List
                .of(trimToNull(line1), trimToNull(line2), trimToNull(city), trimToNull(state), trimToNull(zipCode))
                .stream()
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + ", " + right)
                .orElse(null);
    }
}