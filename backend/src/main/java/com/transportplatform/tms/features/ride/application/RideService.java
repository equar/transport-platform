package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.api.request.CancelRideRequest;
import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RideResponse;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideService {

    private final RideRepository rideRepository;
    private final RideAccessService rideAccessService;
    private final RideReferenceValidationService rideReferenceValidationService;
    private final RideMapper rideMapper;
    private final RideCodeGenerator rideCodeGenerator;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public RideService(RideRepository rideRepository,
            RideAccessService rideAccessService,
            RideReferenceValidationService rideReferenceValidationService,
            RideMapper rideMapper,
            RideCodeGenerator rideCodeGenerator,
            AuditLogService auditLogService,
            Clock clock) {
        this.rideRepository = rideRepository;
        this.rideAccessService = rideAccessService;
        this.rideReferenceValidationService = rideReferenceValidationService;
        this.rideMapper = rideMapper;
        this.rideCodeGenerator = rideCodeGenerator;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<RideResponse> searchCompanyRides(String keyword,
            RideStatus status,
            ServiceType serviceType,
            RideTripType tripType,
            Long riderId,
            Long organizationId,
            Long contractId,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean recurringOnly,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = rideAccessService.requireCompanyTenantId();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : LocalDateTime.of(toDate, LocalTime.MAX);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = rideRepository.findAll(
                RideSpecifications.search(
                        tenantId,
                        keyword,
                        status,
                        serviceType,
                        tripType,
                        riderId,
                        organizationId,
                        contractId,
                        fromDateTime,
                        toDateTime,
                        recurringOnly),
                pageable);
        return PageResponse.from(result.map(rideMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public RideResponse getCompanyRide(Long rideId) {
        return rideMapper.toResponse(rideAccessService.findRideForCompanyScope(rideId));
    }

    @Transactional
    public RideResponse createCompanyRide(RideUpsertRequest request) {
        String tenantId = rideAccessService.requireCompanyTenantId();
        RideReferenceValidationService.ResolvedReferences references = rideReferenceValidationService.resolve(
                tenantId,
                request.riderId(),
                request.guardianId(),
                request.organizationId(),
                request.contractId(),
                request.serviceAreaId());
        Ride ride = new Ride();
        ride.setTenantId(tenantId);
        ride.setRideNumber(rideCodeGenerator.generate(tenantId));
        ride.setStatus(RideStatusWorkflow.resolveInitialStatus(request.status()));
        rideMapper.apply(ride, request, references);
        validateBusinessRules(ride);
        Ride saved = rideRepository.save(ride);
        recordAudit(saved, "CREATED", "Ride " + saved.getRideNumber() + " was created.", null, snapshot(saved));
        return rideMapper.toResponse(saved);
    }

    @Transactional
    public RideResponse updateCompanyRide(Long rideId, RideUpsertRequest request) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        RideStatusWorkflow.ensureCanEdit(ride.getStatus());
        RideReferenceValidationService.ResolvedReferences references = rideReferenceValidationService.resolve(
                ride.getTenantId(),
                request.riderId(),
                request.guardianId(),
                request.organizationId(),
                request.contractId(),
                request.serviceAreaId());
        Object oldSnapshot = snapshot(ride);
        rideMapper.apply(ride, request, references);
        validateBusinessRules(ride);
        Ride saved = rideRepository.save(ride);
        recordAudit(saved, "UPDATED", "Ride " + saved.getRideNumber() + " was updated.", oldSnapshot,
                snapshot(saved));
        return rideMapper.toResponse(saved);
    }

    @Transactional
    public RideResponse requestCompanyRide(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        RideStatusWorkflow.ensureCanRequest(ride.getStatus());
        return updateStatus(ride, RideStatus.REQUESTED, "REQUESTED",
                "Ride " + ride.getRideNumber() + " was submitted as requested.");
    }

    @Transactional
    public RideResponse reviewCompanyRide(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        RideStatusWorkflow.ensureCanReview(ride.getStatus());
        return updateStatus(ride, RideStatus.PENDING_REVIEW, "UNDER_REVIEW",
                "Ride " + ride.getRideNumber() + " was moved into review.");
    }

    @Transactional
    public RideResponse scheduleCompanyRide(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        RideStatusWorkflow.ensureCanSchedule(ride.getStatus());
        return updateStatus(ride, RideStatus.SCHEDULED, "SCHEDULED",
                "Ride " + ride.getRideNumber() + " was scheduled.");
    }

    @Transactional
    public RideResponse cancelCompanyRide(Long rideId, CancelRideRequest request) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        RideStatusWorkflow.ensureCanCancel(ride.getStatus());
        Object oldSnapshot = snapshot(ride);
        AuthenticatedUser currentUser = rideAccessService.requireCompanyUser();
        ride.setStatus(RideStatus.CANCELLED);
        ride.setCancellationReason(request.reason().trim());
        ride.setCancelledAt(Instant.now(clock));
        ride.setCancelledBy(currentUser.displayName());
        Ride saved = rideRepository.save(ride);
        recordAudit(saved, "CANCELLED", "Ride " + saved.getRideNumber() + " was cancelled.", oldSnapshot,
                snapshot(saved));
        return rideMapper.toResponse(saved);
    }

    private RideResponse updateStatus(Ride ride, RideStatus targetStatus, String action, String summary) {
        Object oldSnapshot = snapshot(ride);
        ride.setStatus(targetStatus);
        if (targetStatus != RideStatus.CANCELLED) {
            ride.setCancellationReason(null);
            ride.setCancelledAt(null);
            ride.setCancelledBy(null);
        }
        Ride saved = rideRepository.save(ride);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return rideMapper.toResponse(saved);
    }

    private void validateBusinessRules(Ride ride) {
        if (ride.getScheduledDropoffAt() != null
                && ride.getScheduledDropoffAt().isBefore(ride.getScheduledPickupAt())) {
            throw validationFailure("Scheduled dropoff time cannot be earlier than scheduled pickup time.");
        }
        if (ride.getTripType() == RideTripType.ONE_WAY) {
            if (ride.getReturnPickupAt() != null || ride.getReturnDropoffAt() != null) {
                throw validationFailure("Return trip times can only be provided for round-trip rides.");
            }
        } else {
            if (ride.getReturnPickupAt() == null || ride.getReturnDropoffAt() == null) {
                throw validationFailure("Return pickup and return dropoff times are required for round-trip rides.");
            }
            if (ride.getScheduledDropoffAt() != null
                    && ride.getReturnPickupAt().isBefore(ride.getScheduledDropoffAt())) {
                throw validationFailure("Return pickup time cannot be earlier than scheduled dropoff time.");
            }
            if (ride.getReturnDropoffAt().isBefore(ride.getReturnPickupAt())) {
                throw validationFailure("Return dropoff time cannot be earlier than return pickup time.");
            }
        }
        if (ride.getCompanionCount() < 0) {
            throw validationFailure("Companion count cannot be negative.");
        }
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private void recordAudit(Ride ride, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                ride.getTenantId(),
                "RIDE",
                action,
                "RIDE",
                resolveEntityId(ride),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Ride ride) {
        if (ride.getId() != null) {
            return ride.getId().toString();
        }
        return ride.getRideNumber();
    }

    private Object snapshot(Ride ride) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", ride.getId());
        values.put("rideNumber", ride.getRideNumber());
        values.put("riderId", ride.getRider().getId());
        values.put("organizationId", ride.getOrganization() == null ? null : ride.getOrganization().getId());
        values.put("contractId", ride.getContract() == null ? null : ride.getContract().getId());
        values.put("serviceAreaId", ride.getServiceArea() == null ? null : ride.getServiceArea().getId());
        values.put("serviceType", ride.getServiceType() == null ? null : ride.getServiceType().name());
        values.put("tripType", ride.getTripType() == null ? null : ride.getTripType().name());
        values.put("scheduledPickupAt", ride.getScheduledPickupAt());
        values.put("scheduledDropoffAt", ride.getScheduledDropoffAt());
        values.put("returnPickupAt", ride.getReturnPickupAt());
        values.put("returnDropoffAt", ride.getReturnDropoffAt());
        values.put("status", ride.getStatus() == null ? null : ride.getStatus().name());
        values.put("cancellationReason", ride.getCancellationReason());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "rideNumber", "scheduledPickupAt", "scheduledDropoffAt", "status" ->
                resolved;
            default -> "updatedAt";
        };
    }
}