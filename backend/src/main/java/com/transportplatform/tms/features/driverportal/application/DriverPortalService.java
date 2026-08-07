package com.transportplatform.tms.features.driverportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.application.DriverDocumentStorageService;
import com.transportplatform.tms.features.driverportal.api.request.DriverPortalProfileUpdateRequest;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalComplianceIssueResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalComplianceSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDashboardResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDocumentResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalProfileResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteSummaryResponse;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.ride.application.RideSpecifications;
import com.transportplatform.tms.features.ride.application.RideStatusWorkflow;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rideevent.domain.RideEvent;
import com.transportplatform.tms.features.rideevent.domain.RideEventRepository;
import com.transportplatform.tms.features.rideevent.domain.RideEventType;
import com.transportplatform.tms.features.route.application.RouteSpecifications;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import jakarta.transaction.Transactional;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DriverPortalService {

    private static final Set<ComplianceIssueStatus> UNRESOLVED_COMPLIANCE_STATUSES = Set.of(
            ComplianceIssueStatus.OPEN,
            ComplianceIssueStatus.ACKNOWLEDGED);

    private static final Set<RideStatus> ACTIVE_ASSIGNED_RIDE_STATUSES = Set.of(
            RideStatus.ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP,
            RideStatus.DROPPED_OFF);

    private static final Set<RouteStatus> ACTIVE_ROUTE_STATUSES = Set.of(
            RouteStatus.PLANNED,
            RouteStatus.READY,
            RouteStatus.IN_PROGRESS);

    private final DriverPortalAccessService driverPortalAccessService;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final DriverRepository driverRepository;
    private final DriverDocumentRepository driverDocumentRepository;
    private final ComplianceIssueRepository complianceIssueRepository;
    private final NotificationRepository notificationRepository;
    private final RideRepository rideRepository;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final RideEventRepository rideEventRepository;
    private final DriverPortalMapper driverPortalMapper;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final DriverDocumentStorageService driverDocumentStorageService;
    private final ComplianceIssueSyncService complianceIssueSyncService;
    private final Clock clock;

    public DriverPortalService(DriverPortalAccessService driverPortalAccessService,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            DriverRepository driverRepository,
            DriverDocumentRepository driverDocumentRepository,
            ComplianceIssueRepository complianceIssueRepository,
            NotificationRepository notificationRepository,
            RideRepository rideRepository,
            RouteRepository routeRepository,
            RouteStopRepository routeStopRepository,
            RideEventRepository rideEventRepository,
            DriverPortalMapper driverPortalMapper,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            DriverDocumentStorageService driverDocumentStorageService,
            ComplianceIssueSyncService complianceIssueSyncService,
            Clock clock) {
        this.driverPortalAccessService = driverPortalAccessService;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.driverRepository = driverRepository;
        this.driverDocumentRepository = driverDocumentRepository;
        this.complianceIssueRepository = complianceIssueRepository;
        this.notificationRepository = notificationRepository;
        this.rideRepository = rideRepository;
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
        this.rideEventRepository = rideEventRepository;
        this.driverPortalMapper = driverPortalMapper;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.driverDocumentStorageService = driverDocumentStorageService;
        this.complianceIssueSyncService = complianceIssueSyncService;
        this.clock = clock;
    }

    @Transactional
    public DriverPortalDashboardResponse getDashboard() {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        complianceIssueSyncService.synchronizeTenantIssues(driver.getTenantId());
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        LocalDate today = LocalDate.now(clock);
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = LocalDateTime.of(today, LocalTime.MAX);

        long ridesToday = rideRepository.count(
                RideSpecifications.search(driver.getTenantId(), null, null, null, null, null, null, null, from, to,
                        driver.getId(), null));
        long assignedRides = rideRepository.count(
                RideSpecifications.search(driver.getTenantId(), null, null, null, null, null, null, null, null, null,
                        driver.getId(), null)
                        .and((root, query, builder) -> root.get("status").in(ACTIVE_ASSIGNED_RIDE_STATUSES)));
        long activeRoutesToday = routeRepository.count(
                RouteSpecifications.search(driver.getTenantId(), null, null, null, today, today, driver.getId())
                        .and((root, query, builder) -> root.get("status").in(ACTIVE_ROUTE_STATUSES)));
        long unresolvedComplianceIssues = complianceIssueRepository
                .countByTenantIdAndEntityTypeAndEntityIdAndIssueStatusIn(
                        driver.getTenantId(),
                        ComplianceEntityType.DRIVER,
                        driver.getId(),
                        UNRESOLVED_COMPLIANCE_STATUSES);
        long expiringDocumentsSoon = loadDriverDocuments(driver).stream()
                .filter(this::isExpiringSoon)
                .count();
        long unreadNotifications = notificationRepository.countByTenantIdAndRecipientUserIdAndReadStatusAndStatus(
                user.tenantId(),
                user.id(),
                NotificationReadStatus.UNREAD,
                NotificationStatus.ACTIVE);
        return new DriverPortalDashboardResponse(
                ridesToday,
                assignedRides,
                activeRoutesToday,
                unresolvedComplianceIssues,
                expiringDocumentsSoon,
                unreadNotifications);
    }

    @Transactional
    public DriverPortalProfileResponse getProfile() {
        return driverPortalMapper.toProfileResponse(driverPortalAccessService.resolveCurrentDriver());
    }

    @Transactional
    public DriverPortalProfileResponse updateProfile(DriverPortalProfileUpdateRequest request) {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        Object oldSnapshot = snapshotDriver(driver);
        driverPortalMapper.applyProfileUpdate(driver, request);
        validateDriverProfile(driver);
        Driver saved = driverRepository.save(driver);
        recordDriverAudit(saved, "PROFILE_UPDATED", "Driver portal profile updated.", oldSnapshot,
                snapshotDriver(saved));
        return driverPortalMapper.toProfileResponse(saved);
    }

    @Transactional
    public DriverPortalComplianceSummaryResponse getComplianceSummary() {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        complianceIssueSyncService.synchronizeTenantIssues(driver.getTenantId());
        List<DriverPortalDocumentResponse> documents = loadDriverDocuments(driver).stream()
                .map(driverPortalMapper::toDocumentResponse)
                .toList();
        List<DriverPortalComplianceIssueResponse> issues = complianceIssueRepository
                .findAllByTenantIdAndEntityTypeAndEntityId(
                        driver.getTenantId(),
                        ComplianceEntityType.DRIVER,
                        driver.getId())
                .stream()
                .filter(issue -> UNRESOLVED_COMPLIANCE_STATUSES.contains(issue.getIssueStatus()))
                .map(driverPortalMapper::toComplianceIssueResponse)
                .toList();
        long unresolvedComplianceIssues = issues.size();
        long expiringDocumentsSoon = documents.stream()
                .filter(document -> isExpiringSoon(document.expiryDate(), document.status(),
                        document.verificationStatus()))
                .count();
        return new DriverPortalComplianceSummaryResponse(
                unresolvedComplianceIssues,
                expiringDocumentsSoon,
                issues,
                documents);
    }

    @Transactional
    public DriverPortalDocumentResponse uploadDocument(DriverDocumentType documentType,
            String documentNumber,
            String issuingAuthority,
            LocalDate issueDate,
            LocalDate expiryDate,
            String notes,
            MultipartFile file) {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        if (issueDate != null && expiryDate != null && expiryDate.isBefore(issueDate)) {
            throw validationFailure("Document expiry date cannot be earlier than the issue date.");
        }
        String storagePath = driverDocumentStorageService.store(driver.getTenantId(), driver.getId(), file);
        String originalName = file.getOriginalFilename() == null ? "document" :
                java.nio.file.Path.of(file.getOriginalFilename()).getFileName().toString();
        DriverDocument document = new DriverDocument();
        document.setTenantId(driver.getTenantId());
        document.setDriver(driver);
        document.setDocumentType(documentType);
        document.setFileName(java.nio.file.Path.of(storagePath).getFileName().toString());
        document.setOriginalFileName(originalName.substring(0, Math.min(originalName.length(), 255)));
        document.setContentType(file.getContentType());
        document.setStoragePath(storagePath);
        document.setDocumentNumber(trimToNull(documentNumber));
        document.setIssuingAuthority(trimToNull(issuingAuthority));
        document.setIssueDate(issueDate);
        document.setExpiryDate(expiryDate);
        document.setNotes(trimToNull(notes));
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setVerificationStatus(expiryDate != null && expiryDate.isBefore(LocalDate.now(clock))
                ? DriverDocumentVerificationStatus.EXPIRED
                : DriverDocumentVerificationStatus.PENDING);
        document.setUploadedBy(currentAuthenticatedUserService.requireCurrentUser().username());
        document.setUploadedAt(java.time.Instant.now(clock));
        DriverDocument saved = driverDocumentRepository.save(document);
        auditLogService.record(new AuditLogCommand(null, saved.getTenantId(), "DRIVER_PORTAL",
                "DOCUMENT_SUBMITTED", "DRIVER_DOCUMENT", saved.getId().toString(),
                "Driver submitted " + saved.getDocumentType().name() + " for company review.", null,
                Map.of("driverId", driver.getId(), "documentType", saved.getDocumentType().name(),
                        "fileName", saved.getOriginalFileName())));
        complianceIssueSyncService.synchronizeTenantIssues(saved.getTenantId());
        return driverPortalMapper.toDocumentResponse(saved);
    }

    @Transactional
    public PageResponse<DriverPortalRideSummaryResponse> searchMyRides(String keyword,
            RideStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : LocalDateTime.of(toDate, LocalTime.MAX);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveRideSortField(sortBy)));
        var result = rideRepository.findAll(
                RideSpecifications.search(
                        driver.getTenantId(),
                        keyword,
                        status,
                        null,
                        null,
                        null,
                        null,
                        null,
                        fromDateTime,
                        toDateTime,
                        driver.getId(),
                        null),
                pageable);
        return PageResponse.from(result.map(driverPortalMapper::toRideSummaryResponse));
    }

    @Transactional
    public DriverPortalRideDetailResponse getMyRide(Long rideId) {
        return driverPortalMapper.toRideDetailResponse(driverPortalAccessService.requireAssignedRide(rideId));
    }

    @Transactional
    public PageResponse<DriverPortalRouteSummaryResponse> searchMyRoutes(String keyword,
            RouteStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        Driver driver = driverPortalAccessService.resolveCurrentDriver();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveRouteSortField(sortBy)));
        var result = routeRepository.findAll(
                RouteSpecifications.search(driver.getTenantId(), keyword, status, null, fromDate, toDate,
                        driver.getId()),
                pageable);
        return PageResponse.from(result.map(route -> driverPortalMapper.toRouteSummaryResponse(
                route,
                countLinkedRides(route.getTenantId(), route.getId()))));
    }

    @Transactional
    public DriverPortalRouteDetailResponse getMyRoute(Long routeId) {
        Route route = driverPortalAccessService.requireAssignedRoute(routeId);
        var stops = routeStopRepository
                .findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(route.getTenantId(), route.getId())
                .stream()
                .map(driverPortalMapper::toRouteStopResponse)
                .toList();
        return driverPortalMapper.toRouteDetailResponse(route, stops);
    }

    @Transactional
    public DriverPortalRideDetailResponse markRideDriverEnRoute(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkDriverEnRoute(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.DRIVER_EN_ROUTE,
                RideEventType.DRIVER_EN_ROUTE,
                "DRIVER_EN_ROUTE",
                "Driver marked ride as en route."));
    }

    @Transactional
    public DriverPortalRideDetailResponse markRideArrived(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkArrived(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.ARRIVED,
                RideEventType.ARRIVED,
                "ARRIVED",
                "Driver marked ride as arrived."));
    }

    @Transactional
    public DriverPortalRideDetailResponse markRidePickedUp(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkPickedUp(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.PICKED_UP,
                RideEventType.PICKED_UP,
                "PICKED_UP",
                "Driver marked rider as picked up."));
    }

    @Transactional
    public DriverPortalRideDetailResponse markRideDroppedOff(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkDroppedOff(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.DROPPED_OFF,
                RideEventType.DROPPED_OFF,
                "DROPPED_OFF",
                "Driver marked rider as dropped off."));
    }

    @Transactional
    public DriverPortalRideDetailResponse completeRide(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkCompleted(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.COMPLETED,
                RideEventType.COMPLETED,
                "COMPLETED",
                "Driver completed the ride."));
    }

    @Transactional
    public DriverPortalRideDetailResponse markRideNoShow(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkNoShow(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.RIDER_NO_SHOW,
                RideEventType.NO_SHOW,
                "NO_SHOW",
                "Driver marked the rider as no show."));
    }

    @Transactional
    public DriverPortalRideDetailResponse markRideFailed(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        RideStatusWorkflow.ensureCanMarkFailed(ride.getStatus());
        return driverPortalMapper.toRideDetailResponse(updateRideStatus(
                ride,
                RideStatus.FAILED,
                RideEventType.FAILED,
                "FAILED",
                "Driver marked the ride as failed."));
    }

    @Transactional
    public DriverPortalRideDetailResponse addRideNote(Long rideId, String note) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        String trimmedNote = trimToNull(note);
        if (trimmedNote == null) {
            throw validationFailure("Ride note cannot be blank.");
        }
        Object oldSnapshot = snapshotRide(ride);
        ride.setOperationalNotes(mergeNotes(ride.getOperationalNotes(), trimmedNote));
        Ride saved = rideRepository.save(ride);
        persistRideEvent(saved, RideEventType.NOTE_ADDED, saved.getStatus(), saved.getStatus(), trimmedNote);
        recordRideAudit(saved, "NOTE_ADDED", "Driver added an operational note to the ride.", oldSnapshot,
                snapshotRide(saved));
        return driverPortalMapper.toRideDetailResponse(saved);
    }

    private Ride updateRideStatus(Ride ride,
            RideStatus targetStatus,
            RideEventType eventType,
            String auditAction,
            String summary) {
        Object oldSnapshot = snapshotRide(ride);
        RideStatus previousStatus = ride.getStatus();
        ride.setStatus(targetStatus);
        if (targetStatus != RideStatus.CANCELLED) {
            ride.setCancellationReason(null);
            ride.setCancelledAt(null);
            ride.setCancelledBy(null);
        }
        Ride saved = rideRepository.save(ride);
        persistRideEvent(saved, eventType, previousStatus, targetStatus, summary);
        recordRideAudit(saved, auditAction, summary, oldSnapshot, snapshotRide(saved));
        notificationEventService.publishRideStatusChanged(saved, previousStatus, targetStatus);
        return saved;
    }

    private void persistRideEvent(Ride ride,
            RideEventType eventType,
            RideStatus previousStatus,
            RideStatus newStatus,
            String notes) {
        AuthenticatedUser actor = currentAuthenticatedUserService.requireCurrentUser();
        RideEvent rideEvent = new RideEvent();
        rideEvent.setTenantId(ride.getTenantId());
        rideEvent.setRide(ride);
        rideEvent.setEventType(eventType);
        rideEvent.setActorUserId(actor.id());
        rideEvent.setActorName(actor.displayName());
        rideEvent.setActorEmail(actor.username());
        rideEvent.setPreviousStatus(previousStatus);
        rideEvent.setNewStatus(newStatus);
        rideEvent.setNotes(trimToNull(notes));
        rideEventRepository.save(rideEvent);
    }

    private void validateDriverProfile(Driver driver) {
        if (trimToNull(driver.getPhone()) == null) {
            throw validationFailure("Phone is required.");
        }
    }

    private List<DriverDocument> loadDriverDocuments(Driver driver) {
        return driverDocumentRepository.findAllByTenantIdAndDriver_IdIn(driver.getTenantId(), List.of(driver.getId()));
    }

    private boolean isExpiringSoon(DriverDocument document) {
        return isExpiringSoon(document.getExpiryDate(), document.getStatus(), document.getVerificationStatus());
    }

    private boolean isExpiringSoon(LocalDate expiryDate,
            DriverDocumentStatus status,
            DriverDocumentVerificationStatus verificationStatus) {
        if (expiryDate == null || status != DriverDocumentStatus.ACTIVE) {
            return false;
        }
        if (verificationStatus == DriverDocumentVerificationStatus.REJECTED) {
            return false;
        }
        LocalDate today = LocalDate.now(clock);
        return !expiryDate.isBefore(today) && !expiryDate.isAfter(today.plusDays(30));
    }

    private long countLinkedRides(String tenantId, Long routeId) {
        return rideRepository.count((root, query, builder) -> builder.and(
                builder.equal(root.get("tenantId"), tenantId),
                builder.equal(root.get("routeId"), routeId)));
    }

    private void recordDriverAudit(Driver driver, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                driver.getTenantId(),
                "DRIVER_PORTAL",
                action,
                "DRIVER",
                driver.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private void recordRideAudit(Ride ride, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                ride.getTenantId(),
                "DRIVER_PORTAL",
                action,
                "RIDE",
                ride.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshotDriver(Driver driver) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", driver.getId());
        values.put("driverCode", driver.getDriverCode());
        values.put("phone", driver.getPhone());
        values.put("alternatePhone", driver.getAlternatePhone());
        values.put("addressLine1", driver.getAddressLine1());
        values.put("addressLine2", driver.getAddressLine2());
        values.put("city", driver.getCity());
        values.put("state", driver.getState());
        values.put("zipCode", driver.getZipCode());
        values.put("country", driver.getCountry());
        values.put("availabilitySummary", driver.getAvailabilitySummary());
        values.put("emergencyContactName", driver.getEmergencyContactName());
        values.put("emergencyContactPhone", driver.getEmergencyContactPhone());
        values.put("emergencyContactRelationship", driver.getEmergencyContactRelationship());
        values.put("notes", driver.getNotes());
        return values;
    }

    private Object snapshotRide(Ride ride) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", ride.getId());
        values.put("rideNumber", ride.getRideNumber());
        values.put("status", ride.getStatus() == null ? null : ride.getStatus().name());
        values.put("operationalNotes", ride.getOperationalNotes());
        values.put("driverId", ride.getDriverId());
        values.put("routeId", ride.getRouteId());
        return values;
    }

    private String resolveRideSortField(String sortBy) {
        String resolved = sortBy == null ? "scheduledPickupAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "rideNumber", "scheduledPickupAt", "scheduledDropoffAt", "status" ->
                resolved;
            default -> "scheduledPickupAt";
        };
    }

    private String resolveRouteSortField(String sortBy) {
        String resolved = sortBy == null ? "routeDate" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "routeCode", "routeName", "routeDate", "status" -> resolved;
            default -> "routeDate";
        };
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String mergeNotes(String existing, String note) {
        String base = trimToNull(existing);
        String extra = trimToNull(note);
        if (base == null) {
            return extra;
        }
        if (extra == null) {
            return base;
        }
        return base + System.lineSeparator() + extra;
    }
}
