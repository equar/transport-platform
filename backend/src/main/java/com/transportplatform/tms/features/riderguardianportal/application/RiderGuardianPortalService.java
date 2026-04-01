package com.transportplatform.tms.features.riderguardianportal.application;

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
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.portalcommon.api.response.PortalRideSummaryResponse;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.riderguardianportal.api.request.RiderGuardianPortalProfileUpdateRequest;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalDashboardResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalLinkedRiderResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalProfileResponse;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalRideDetailResponse;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiderGuardianPortalService {

    private static final Set<RideStatus> UPCOMING_RIDE_STATUSES = Set.of(
            RideStatus.REQUESTED,
            RideStatus.PENDING_REVIEW,
            RideStatus.SCHEDULED,
            RideStatus.ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP,
            RideStatus.DROPPED_OFF);

    private final RiderGuardianPortalAccessService accessService;
    private final RideRepository rideRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final InvoiceMapper invoiceMapper;
    private final PaymentMapper paymentMapper;
    private final InvoiceFinancialService invoiceFinancialService;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public RiderGuardianPortalService(RiderGuardianPortalAccessService accessService,
            RideRepository rideRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            NotificationRepository notificationRepository,
            InvoiceMapper invoiceMapper,
            PaymentMapper paymentMapper,
            InvoiceFinancialService invoiceFinancialService,
            AuditLogService auditLogService,
            Clock clock) {
        this.accessService = accessService;
        this.rideRepository = rideRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.invoiceMapper = invoiceMapper;
        this.paymentMapper = paymentMapper;
        this.invoiceFinancialService = invoiceFinancialService;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public RiderGuardianPortalDashboardResponse getDashboard() {
        var scope = accessService.resolveCurrentScope();
        List<Long> riderIds = scope.linkedRiders().stream().map(Rider::getId).toList();
        LocalDateTime now = LocalDateTime.now(clock);
        long upcomingRideCount = rideRepository.count((root, query, builder) -> buildRideScopePredicate(scope, root,
                query, builder, null, null, now, null, riderIds));
        long activeRideCount = rideRepository.count((root, query, builder) -> builder.and(
                buildRideScopePredicate(scope, root, query, builder, null, null, null, null, riderIds),
                root.get("status").in(UPCOMING_RIDE_STATUSES)));
        long activeRecurringScheduleCount = rideRepository.findAll((root, query, builder) -> builder.and(
                buildRideScopePredicate(scope, root, query, builder, null, null, now, null, riderIds),
                builder.isNotNull(root.get("recurrenceSchedule")))).stream()
                .map(ride -> ride.getRecurrenceSchedule() == null ? null : ride.getRecurrenceSchedule().getId())
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
        var invoices = loadScopedInvoices(scope, null, null, 0, 1000, "invoiceDate", Sort.Direction.DESC).items();
        long openInvoiceCount = invoices.stream()
                .filter(invoice -> invoice.status() == InvoiceStatus.ISSUED
                        || invoice.status() == InvoiceStatus.PARTIALLY_PAID
                        || invoice.status() == InvoiceStatus.OVERDUE)
                .count();
        BigDecimal outstandingBalance = invoices.stream()
                .map(InvoiceSummaryResponse::balanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long unreadNotifications = notificationRepository.countByTenantIdAndRecipientUserIdAndReadStatusAndStatus(
                scope.user().tenantId(),
                scope.user().id(),
                NotificationReadStatus.UNREAD,
                NotificationStatus.ACTIVE);
        return new RiderGuardianPortalDashboardResponse(
                scope.scopeType().name(),
                scope.linkedRiders().size(),
                upcomingRideCount,
                activeRideCount,
                activeRecurringScheduleCount,
                openInvoiceCount,
                outstandingBalance,
                unreadNotifications);
    }

    @Transactional(readOnly = true)
    public RiderGuardianPortalProfileResponse getProfile() {
        return toProfileResponse(accessService.resolveCurrentScope());
    }

    @Transactional
    public RiderGuardianPortalProfileResponse updateProfile(RiderGuardianPortalProfileUpdateRequest request) {
        var scope = accessService.resolveCurrentScope();
        if (scope.scopeType() == PortalSubjectType.RIDER) {
            Rider rider = scope.rider();
            Object oldSnapshot = snapshotRider(rider);
            rider.setEmail(trimToNull(request.email()));
            rider.setPrimaryPhone(requirePhone(request.phone()));
            rider.setAlternatePhone(trimToNull(request.alternatePhone()));
            rider.setHomeAddressLine1(trimToNull(request.addressLine1()));
            rider.setHomeAddressLine2(trimToNull(request.addressLine2()));
            rider.setCity(trimToNull(request.city()));
            rider.setState(trimToNull(request.state()));
            rider.setZipCode(trimToNull(request.zipCode()));
            rider.setCountry(trimToNull(request.country()));
            rider.setDefaultPickupAddress(trimToNull(request.defaultPickupAddress()));
            rider.setDefaultDropoffAddress(trimToNull(request.defaultDropoffAddress()));
            rider.setPickupNotes(trimToNull(request.pickupNotes()));
            rider.setDropoffNotes(trimToNull(request.dropoffNotes()));
            rider.setSpecialInstructions(trimToNull(request.specialInstructions()));
            rider.setEmergencyContactName(trimToNull(request.emergencyContactName()));
            rider.setEmergencyContactPhone(trimToNull(request.emergencyContactPhone()));
            rider.setEmergencyContactRelationship(trimToNull(request.emergencyContactRelationship()));
            rider.setNotes(trimToNull(request.notes()));
            recordAudit(scope.user().tenantId(), "RIDER_PORTAL", "PROFILE_UPDATED", "RIDER", rider.getId().toString(),
                    "Rider portal profile updated.", oldSnapshot, snapshotRider(rider));
        } else {
            Guardian guardian = scope.guardian();
            Object oldSnapshot = snapshotGuardian(guardian);
            guardian.setEmail(trimToNull(request.email()));
            guardian.setPhone(requirePhone(request.phone()));
            guardian.setAlternatePhone(trimToNull(request.alternatePhone()));
            guardian.setAddressLine1(trimToNull(request.addressLine1()));
            guardian.setAddressLine2(trimToNull(request.addressLine2()));
            guardian.setCity(trimToNull(request.city()));
            guardian.setState(trimToNull(request.state()));
            guardian.setZipCode(trimToNull(request.zipCode()));
            guardian.setCountry(trimToNull(request.country()));
            guardian.setPreferredCommunicationMethod(request.preferredCommunicationMethod());
            guardian.setNotes(trimToNull(request.notes()));
            recordAudit(scope.user().tenantId(), "RIDER_PORTAL", "PROFILE_UPDATED", "GUARDIAN",
                    guardian.getId().toString(),
                    "Guardian portal profile updated.", oldSnapshot, snapshotGuardian(guardian));
        }
        return toProfileResponse(scope);
    }

    @Transactional(readOnly = true)
    public List<RiderGuardianPortalLinkedRiderResponse> getLinkedRiders() {
        var scope = accessService.resolveCurrentScope();
        if (scope.scopeType() == PortalSubjectType.RIDER) {
            Rider rider = scope.rider();
            RiderGuardian link = scope.links().stream().findFirst().orElse(null);
            return List.of(new RiderGuardianPortalLinkedRiderResponse(
                    rider.getId(),
                    rider.getRiderCode(),
                    displayName(rider.getFirstName(), rider.getLastName()),
                    link == null ? null : link.getRelationshipType().name(),
                    link != null && link.isPrimaryGuardian(),
                    link != null && link.isAuthorizedForPickup(),
                    link != null && link.isBillingContact(),
                    rider.getStatus().name(),
                    rider.isWheelchairRequired(),
                    rider.isEscortRequired()));
        }
        return scope.links().stream().map(link -> new RiderGuardianPortalLinkedRiderResponse(
                link.getRider().getId(),
                link.getRider().getRiderCode(),
                displayName(link.getRider().getFirstName(), link.getRider().getLastName()),
                link.getRelationshipType().name(),
                link.isPrimaryGuardian(),
                link.isAuthorizedForPickup(),
                link.isBillingContact(),
                link.getRider().getStatus().name(),
                link.getRider().isWheelchairRequired(),
                link.getRider().isEscortRequired())).toList();
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
        List<Long> riderIds = scope.linkedRiders().stream().map(Rider::getId).toList();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : LocalDateTime.of(toDate, LocalTime.MAX);
        Sort.Direction resolvedSortDirection = Objects.requireNonNullElse(sortDirection, Sort.Direction.ASC);
        var pageable = PageRequest.of(page, size, Sort.by(resolvedSortDirection, resolveRideSortField(sortBy)));
        var result = rideRepository.findAll((root, query, builder) -> buildRideScopePredicate(
                scope,
                root,
                query,
                builder,
                keyword,
                status,
                fromDateTime,
                toDateTime,
                riderIds), pageable);
        return PageResponse.from(result.map(this::toRideSummary));
    }

    @Transactional(readOnly = true)
    public RiderGuardianPortalRideDetailResponse getRide(Long rideId) {
        var scope = accessService.resolveCurrentScope();
        Ride ride = rideRepository.findByIdAndTenantId(rideId, scope.user().tenantId())
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Ride not found for the current portal scope."));
        if (!canAccessRide(scope, ride)) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "The current rider or guardian portal account cannot access this ride.");
        }
        return toRideDetail(ride);
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceSummaryResponse> searchInvoices(String keyword,
            InvoiceStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        return loadScopedInvoices(accessService.resolveCurrentScope(), keyword, status, page, size, sortBy,
                sortDirection);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> searchPayments(String keyword,
            PaymentStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        var scope = accessService.resolveCurrentScope();
        Sort.Direction resolvedSortDirection = Objects.requireNonNullElse(sortDirection, Sort.Direction.DESC);
        var pageable = PageRequest.of(page, size, Sort.by(resolvedSortDirection, resolvePaymentSortField(sortBy)));
        LocalDate today = LocalDate.now(clock);
        var result = paymentRepository.findAll((root, query, builder) -> {
            var predicate = PaymentSpecifications.search(scope.user().tenantId(), keyword, status, null, null, null)
                    .toPredicate(root, query, builder);
            var invoiceJoin = root.join("invoice");
            if (scope.scopeType() == PortalSubjectType.RIDER) {
                predicate = builder.and(predicate, builder.equal(invoiceJoin.get("riderId"), scope.rider().getId()));
            } else {
                List<Long> riderIds = scope.linkedRiders().stream().map(Rider::getId).toList();
                predicate = builder.and(predicate, builder.or(
                        builder.equal(invoiceJoin.get("guardianId"), scope.guardian().getId()),
                        invoiceJoin.get("riderId").in(riderIds)));
            }
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(payment -> paymentMapper.toSummary(
                payment,
                InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), today))));
    }

    private PageResponse<InvoiceSummaryResponse> loadScopedInvoices(
            RiderGuardianPortalAccessService.ResolvedRiderGuardianScope scope,
            String keyword,
            InvoiceStatus status,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        LocalDate today = LocalDate.now(clock);
        Sort.Direction resolvedSortDirection = Objects.requireNonNullElse(sortDirection, Sort.Direction.DESC);
        var pageable = PageRequest.of(page, size, Sort.by(resolvedSortDirection, resolveInvoiceSortField(sortBy)));
        var result = invoiceRepository.findAll((root, query, builder) -> {
            var predicate = InvoiceSpecifications
                    .search(scope.user().tenantId(), keyword, status, null, null, null, null, null, today)
                    .toPredicate(root, query, builder);
            if (scope.scopeType() == PortalSubjectType.RIDER) {
                predicate = builder.and(predicate, builder.equal(root.get("riderId"), scope.rider().getId()));
            } else {
                List<Long> riderIds = scope.linkedRiders().stream().map(Rider::getId).toList();
                predicate = builder.and(predicate, builder.or(
                        builder.equal(root.get("guardianId"), scope.guardian().getId()),
                        root.get("riderId").in(riderIds)));
            }
            return predicate;
        }, pageable);
        return PageResponse.from(result.map(invoice -> toInvoiceSummary(invoice, today)));
    }

    private jakarta.persistence.criteria.Predicate buildRideScopePredicate(
            RiderGuardianPortalAccessService.ResolvedRiderGuardianScope scope,
            jakarta.persistence.criteria.Root<Ride> root,
            jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder builder,
            String keyword,
            RideStatus status,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            List<Long> riderIds) {
        query.distinct(true);
        var predicate = builder.equal(root.get("tenantId"), scope.user().tenantId());
        if (scope.scopeType() == PortalSubjectType.RIDER) {
            predicate = builder.and(predicate, builder.equal(root.get("rider").get("id"), scope.rider().getId()));
        } else {
            predicate = builder.and(predicate, builder.or(
                    builder.equal(root.get("guardian").get("id"), scope.guardian().getId()),
                    root.get("rider").get("id").in(riderIds)));
        }
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            predicate = builder.and(predicate, builder.or(
                    builder.like(builder.lower(root.get("rideNumber")), pattern),
                    builder.like(builder.lower(root.get("rider").get("firstName")), pattern),
                    builder.like(builder.lower(root.get("rider").get("lastName")), pattern),
                    builder.like(builder.lower(root.get("organization").get("name")), pattern)));
        }
        if (status != null) {
            predicate = builder.and(predicate, builder.equal(root.get("status"), status));
        }
        if (fromDateTime != null) {
            predicate = builder.and(predicate,
                    builder.greaterThanOrEqualTo(root.get("scheduledPickupAt"), fromDateTime));
        }
        if (toDateTime != null) {
            predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("scheduledPickupAt"), toDateTime));
        }
        return predicate;
    }

    private RiderGuardianPortalProfileResponse toProfileResponse(
            RiderGuardianPortalAccessService.ResolvedRiderGuardianScope scope) {
        if (scope.scopeType() == PortalSubjectType.RIDER) {
            Rider rider = scope.rider();
            return new RiderGuardianPortalProfileResponse(
                    "RIDER",
                    rider.getId(),
                    rider.getRiderCode(),
                    rider.getFirstName(),
                    rider.getLastName(),
                    rider.getEmail(),
                    rider.getPrimaryPhone(),
                    rider.getAlternatePhone(),
                    rider.getHomeAddressLine1(),
                    rider.getHomeAddressLine2(),
                    rider.getCity(),
                    rider.getState(),
                    rider.getZipCode(),
                    rider.getCountry(),
                    rider.getDefaultPickupAddress(),
                    rider.getDefaultDropoffAddress(),
                    rider.getPickupNotes(),
                    rider.getDropoffNotes(),
                    rider.getSpecialInstructions(),
                    rider.getEmergencyContactName(),
                    rider.getEmergencyContactPhone(),
                    rider.getEmergencyContactRelationship(),
                    null,
                    rider.getNotes(),
                    rider.getStatus().name(),
                    rider.getUpdatedAt());
        }
        Guardian guardian = scope.guardian();
        return new RiderGuardianPortalProfileResponse(
                "GUARDIAN",
                guardian.getId(),
                null,
                guardian.getFirstName(),
                guardian.getLastName(),
                guardian.getEmail(),
                guardian.getPhone(),
                guardian.getAlternatePhone(),
                guardian.getAddressLine1(),
                guardian.getAddressLine2(),
                guardian.getCity(),
                guardian.getState(),
                guardian.getZipCode(),
                guardian.getCountry(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                guardian.getPreferredCommunicationMethod() == null ? null
                        : guardian.getPreferredCommunicationMethod().name(),
                guardian.getNotes(),
                guardian.getStatus().name(),
                guardian.getUpdatedAt());
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
                ride.getRouteId(),
                ride.getRecurrenceSchedule() == null ? null : ride.getRecurrenceSchedule().getId());
    }

    private RiderGuardianPortalRideDetailResponse toRideDetail(Ride ride) {
        return new RiderGuardianPortalRideDetailResponse(
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
                ride.getRouteId(),
                ride.getRecurrenceSchedule() == null ? null : ride.getRecurrenceSchedule().getId(),
                ride.getRecurrenceSchedule() != null);
    }

    private boolean canAccessRide(RiderGuardianPortalAccessService.ResolvedRiderGuardianScope scope, Ride ride) {
        if (scope.scopeType() == PortalSubjectType.RIDER) {
            return ride.getRider() != null && ride.getRider().getId().equals(scope.rider().getId());
        }
        if (ride.getGuardian() != null && ride.getGuardian().getId().equals(scope.guardian().getId())) {
            return true;
        }
        List<Long> riderIds = scope.linkedRiders().stream().map(Rider::getId).toList();
        return ride.getRider() != null && riderIds.contains(ride.getRider().getId());
    }

    private InvoiceSummaryResponse toInvoiceSummary(Invoice invoice, LocalDate today) {
        return invoiceMapper.toSummary(
                invoice,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today),
                invoiceFinancialService.resolveDaysPastDue(invoice, today),
                invoiceFinancialService.resolveAgingBucket(invoice, today));
    }

    private void recordAudit(String tenantId,
            String module,
            String action,
            String entityType,
            String entityId,
            String summary,
            Object oldValue,
            Object newValue) {
        auditLogService.record(
                new AuditLogCommand(null, tenantId, module, action, entityType, entityId, summary, oldValue, newValue));
    }

    private Object snapshotRider(Rider rider) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("email", rider.getEmail());
        values.put("primaryPhone", rider.getPrimaryPhone());
        values.put("alternatePhone", rider.getAlternatePhone());
        values.put("homeAddressLine1", rider.getHomeAddressLine1());
        values.put("homeAddressLine2", rider.getHomeAddressLine2());
        values.put("city", rider.getCity());
        values.put("state", rider.getState());
        values.put("zipCode", rider.getZipCode());
        values.put("country", rider.getCountry());
        values.put("defaultPickupAddress", rider.getDefaultPickupAddress());
        values.put("defaultDropoffAddress", rider.getDefaultDropoffAddress());
        values.put("pickupNotes", rider.getPickupNotes());
        values.put("dropoffNotes", rider.getDropoffNotes());
        values.put("specialInstructions", rider.getSpecialInstructions());
        values.put("emergencyContactName", rider.getEmergencyContactName());
        values.put("emergencyContactPhone", rider.getEmergencyContactPhone());
        values.put("emergencyContactRelationship", rider.getEmergencyContactRelationship());
        values.put("notes", rider.getNotes());
        return values;
    }

    private Object snapshotGuardian(Guardian guardian) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("email", guardian.getEmail());
        values.put("phone", guardian.getPhone());
        values.put("alternatePhone", guardian.getAlternatePhone());
        values.put("addressLine1", guardian.getAddressLine1());
        values.put("addressLine2", guardian.getAddressLine2());
        values.put("city", guardian.getCity());
        values.put("state", guardian.getState());
        values.put("zipCode", guardian.getZipCode());
        values.put("country", guardian.getCountry());
        values.put("preferredCommunicationMethod", guardian.getPreferredCommunicationMethod() == null ? null
                : guardian.getPreferredCommunicationMethod().name());
        values.put("notes", guardian.getNotes());
        return values;
    }

    private String resolveRideSortField(String sortBy) {
        String resolved = sortBy == null ? "scheduledPickupAt" : sortBy;
        return switch (resolved) {
            case "scheduledPickupAt", "scheduledDropoffAt", "rideNumber", "status", "updatedAt", "createdAt" ->
                resolved;
            default -> "scheduledPickupAt";
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