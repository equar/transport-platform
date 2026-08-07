package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.api.request.GenerateRecurringRideInstancesRequest;
import com.transportplatform.tms.features.ride.api.request.RecurringRideScheduleUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RecurringRideScheduleResponse;
import com.transportplatform.tms.features.ride.api.response.RideGenerationResultResponse;
import com.transportplatform.tms.features.ride.domain.RecurringRideSchedule;
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRecurrencePatternType;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecurringRideScheduleService {

    private final RecurringRideScheduleRepository recurringRideScheduleRepository;
    private final RideRepository rideRepository;
    private final RideAccessService rideAccessService;
    private final RideReferenceValidationService rideReferenceValidationService;
    private final RecurringRideScheduleMapper recurringRideScheduleMapper;
    private final RecurringRideCodeGenerator recurringRideCodeGenerator;
    private final RideCodeGenerator rideCodeGenerator;
    private final RideEventService rideEventService;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public RecurringRideScheduleService(RecurringRideScheduleRepository recurringRideScheduleRepository,
            RideRepository rideRepository,
            RideAccessService rideAccessService,
            RideReferenceValidationService rideReferenceValidationService,
            RecurringRideScheduleMapper recurringRideScheduleMapper,
            RecurringRideCodeGenerator recurringRideCodeGenerator,
            RideCodeGenerator rideCodeGenerator,
            RideEventService rideEventService,
            AuditLogService auditLogService,
            Clock clock) {
        this.recurringRideScheduleRepository = recurringRideScheduleRepository;
        this.rideRepository = rideRepository;
        this.rideAccessService = rideAccessService;
        this.rideReferenceValidationService = rideReferenceValidationService;
        this.recurringRideScheduleMapper = recurringRideScheduleMapper;
        this.recurringRideCodeGenerator = recurringRideCodeGenerator;
        this.rideCodeGenerator = rideCodeGenerator;
        this.rideEventService = rideEventService;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<RecurringRideScheduleResponse> searchCompanyRecurringRideSchedules(String keyword,
            RideRecurrenceStatus status,
            ServiceType serviceType,
            RideTripType tripType,
            RideRecurrencePatternType recurrencePatternType,
            Long riderId,
            Long organizationId,
            Long contractId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = rideAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = recurringRideScheduleRepository.findAll(
                RecurringRideScheduleSpecifications.search(
                        tenantId,
                        keyword,
                        status,
                        serviceType,
                        tripType,
                        recurrencePatternType,
                        riderId,
                        organizationId,
                        contractId,
                        fromDate,
                        toDate),
                pageable);
        return PageResponse.from(result.map(schedule -> recurringRideScheduleMapper.toResponse(
                schedule,
                rideRepository.countByTenantIdAndRecurrenceScheduleId(tenantId, schedule.getId()))));
    }

    @Transactional(readOnly = true)
    public RecurringRideScheduleResponse getCompanyRecurringRideSchedule(Long recurrenceId) {
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        return recurringRideScheduleMapper.toResponse(
                schedule,
                rideRepository.countByTenantIdAndRecurrenceScheduleId(schedule.getTenantId(), schedule.getId()));
    }

    @Transactional
    public RecurringRideScheduleResponse createCompanyRecurringRideSchedule(
            RecurringRideScheduleUpsertRequest request) {
        String tenantId = rideAccessService.requireCompanyTenantId();
        RideReferenceValidationService.ResolvedReferences references = rideReferenceValidationService.resolve(
                tenantId,
                request.riderId(),
                request.guardianId(),
                request.organizationId(),
                request.contractId(),
                request.serviceAreaId());
        RecurringRideSchedule schedule = new RecurringRideSchedule();
        schedule.setTenantId(tenantId);
        schedule.setRecurrenceCode(recurringRideCodeGenerator.generate(tenantId));
        schedule.setStatus(RideRecurrenceStatusWorkflow.resolveInitialStatus(request.status()));
        recurringRideScheduleMapper.apply(schedule, request, references);
        validateBusinessRules(schedule);
        RecurringRideSchedule saved = recurringRideScheduleRepository.save(schedule);
        recordAudit(saved, "CREATED", "Recurring ride schedule " + saved.getRecurrenceCode() + " was created.",
                null, snapshot(saved));
        return recurringRideScheduleMapper.toResponse(saved, 0);
    }

    @Transactional
    public RecurringRideScheduleResponse updateCompanyRecurringRideSchedule(Long recurrenceId,
            RecurringRideScheduleUpsertRequest request) {
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        RideRecurrenceStatusWorkflow.ensureCanEdit(schedule.getStatus());
        RideReferenceValidationService.ResolvedReferences references = rideReferenceValidationService.resolve(
                schedule.getTenantId(),
                request.riderId(),
                request.guardianId(),
                request.organizationId(),
                request.contractId(),
                request.serviceAreaId());
        Object oldSnapshot = snapshot(schedule);
        recurringRideScheduleMapper.apply(schedule, request, references);
        validateBusinessRules(schedule);
        RecurringRideSchedule saved = recurringRideScheduleRepository.save(schedule);
        recordAudit(saved, "UPDATED",
                "Recurring ride schedule " + saved.getRecurrenceCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return recurringRideScheduleMapper.toResponse(saved,
                rideRepository.countByTenantIdAndRecurrenceScheduleId(saved.getTenantId(), saved.getId()));
    }

    @Transactional
    public RecurringRideScheduleResponse activateCompanyRecurringRideSchedule(Long recurrenceId) {
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        RideRecurrenceStatusWorkflow.ensureCanActivate(schedule.getStatus());
        return updateStatus(schedule, RideRecurrenceStatus.ACTIVE, "ACTIVATED",
                "Recurring ride schedule " + schedule.getRecurrenceCode() + " was activated.");
    }

    @Transactional
    public RecurringRideScheduleResponse pauseCompanyRecurringRideSchedule(Long recurrenceId) {
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        RideRecurrenceStatusWorkflow.ensureCanPause(schedule.getStatus());
        return updateStatus(schedule, RideRecurrenceStatus.PAUSED, "PAUSED",
                "Recurring ride schedule " + schedule.getRecurrenceCode() + " was paused.");
    }

    @Transactional
    public RecurringRideScheduleResponse deactivateCompanyRecurringRideSchedule(Long recurrenceId) {
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        RideRecurrenceStatusWorkflow.ensureCanDeactivate(schedule.getStatus());
        return updateStatus(schedule, RideRecurrenceStatus.INACTIVE, "DEACTIVATED",
                "Recurring ride schedule " + schedule.getRecurrenceCode() + " was deactivated.");
    }

    @Transactional
    public RideGenerationResultResponse generateCompanyRecurringRideInstances(Long recurrenceId,
            GenerateRecurringRideInstancesRequest request) {
        if (request.toDate().isBefore(request.fromDate())) {
            throw validationFailure("Generation end date cannot be earlier than the start date.");
        }
        RecurringRideSchedule schedule = rideAccessService.findRecurringRideScheduleForCompanyScope(recurrenceId);
        RideRecurrenceStatusWorkflow.ensureCanGenerate(schedule.getStatus());

        LocalDate start = request.fromDate().isAfter(schedule.getStartDate()) ? request.fromDate()
                : schedule.getStartDate();
        LocalDate end = schedule.getEndDate() == null || request.toDate().isBefore(schedule.getEndDate())
                ? request.toDate()
                : schedule.getEndDate();
        if (end.isBefore(start)) {
            return new RideGenerationResultResponse(0, 0, 0,
                    "No rides were generated because the selected range does not overlap the recurrence window.");
        }

        int createdCount = 0;
        int duplicateCount = 0;
        int skippedCount = 0;
        long existingCount = rideRepository.countByTenantIdAndRecurrenceScheduleId(schedule.getTenantId(),
                schedule.getId());

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (schedule.getOccurrenceLimit() != null
                    && existingCount + createdCount >= schedule.getOccurrenceLimit()) {
                skippedCount++;
                continue;
            }
            if (schedule.getSkipDates().contains(date) || !matches(date, schedule)) {
                skippedCount++;
                continue;
            }
            LocalDateTime scheduledPickupAt = LocalDateTime.of(date, schedule.getScheduledPickupTime());
            if (rideRepository.existsByTenantIdAndRecurrenceScheduleIdAndScheduledPickupAt(
                    schedule.getTenantId(), schedule.getId(), scheduledPickupAt)) {
                duplicateCount++;
                continue;
            }
            Ride ride = new Ride();
            ride.setTenantId(schedule.getTenantId());
            ride.setRideNumber(rideCodeGenerator.generate(schedule.getTenantId()));
            ride.setRider(schedule.getRider());
            ride.setGuardian(schedule.getGuardian());
            ride.setOrganization(schedule.getOrganization());
            ride.setContract(schedule.getContract());
            ride.setServiceArea(schedule.getServiceArea());
            ride.setServiceType(schedule.getServiceType());
            ride.setTripType(schedule.getTripType());
            ride.setPickupAddressLine1(schedule.getPickupAddressLine1());
            ride.setPickupAddressLine2(schedule.getPickupAddressLine2());
            ride.setPickupCity(schedule.getPickupCity());
            ride.setPickupState(schedule.getPickupState());
            ride.setPickupZipCode(schedule.getPickupZipCode());
            ride.setPickupCountry(schedule.getPickupCountry());
            ride.setDropoffAddressLine1(schedule.getDropoffAddressLine1());
            ride.setDropoffAddressLine2(schedule.getDropoffAddressLine2());
            ride.setDropoffCity(schedule.getDropoffCity());
            ride.setDropoffState(schedule.getDropoffState());
            ride.setDropoffZipCode(schedule.getDropoffZipCode());
            ride.setDropoffCountry(schedule.getDropoffCountry());
            ride.setScheduledPickupAt(scheduledPickupAt);
            ride.setScheduledDropoffAt(schedule.getScheduledDropoffTime() == null
                    ? null
                    : LocalDateTime.of(date, schedule.getScheduledDropoffTime()));
            ride.setReturnPickupAt(schedule.getReturnPickupTime() == null
                    ? null
                    : LocalDateTime.of(date, schedule.getReturnPickupTime()));
            ride.setReturnDropoffAt(schedule.getReturnDropoffTime() == null
                    ? null
                    : LocalDateTime.of(date, schedule.getReturnDropoffTime()));
            ride.setWheelchairRequired(schedule.isWheelchairRequired());
            ride.setEscortRequired(schedule.isEscortRequired());
            ride.setCompanionCount(schedule.getCompanionCount());
            ride.setSpecialInstructions(schedule.getSpecialInstructions());
            ride.setInternalNotes(schedule.getInternalNotes());
            ride.setBillingType(schedule.getBillingType());
            ride.setRecurrenceSchedule(schedule);
            ride.setStatus(RideStatus.SCHEDULED);
            validateGeneratedRide(ride);
            Ride saved = rideRepository.save(ride);
            rideEventService.recordRideCreated(saved,
                    "Ride generated from recurring schedule " + schedule.getRecurrenceCode() + ".");
            recordGeneratedRideAudit(saved, schedule);
            createdCount++;
        }

        recordAudit(schedule, "GENERATED",
                "Generated rides from recurring ride schedule " + schedule.getRecurrenceCode() + ".",
                null,
                Map.of("createdCount", createdCount, "duplicateCount", duplicateCount, "skippedCount", skippedCount,
                        "fromDate", request.fromDate(), "toDate", request.toDate()));

        return new RideGenerationResultResponse(
                createdCount,
                duplicateCount,
                skippedCount,
                createdCount == 0
                        ? "No new ride instances were generated for the selected range."
                        : createdCount + " ride instance(s) were generated for the selected range.");
    }

    private RecurringRideScheduleResponse updateStatus(RecurringRideSchedule schedule,
            RideRecurrenceStatus targetStatus,
            String action,
            String summary) {
        Object oldSnapshot = snapshot(schedule);
        schedule.setStatus(targetStatus);
        RecurringRideSchedule saved = recurringRideScheduleRepository.save(schedule);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return recurringRideScheduleMapper.toResponse(saved,
                rideRepository.countByTenantIdAndRecurrenceScheduleId(saved.getTenantId(), saved.getId()));
    }

    private boolean matches(LocalDate date, RecurringRideSchedule schedule) {
        if (schedule.getRecurrencePatternType() == RideRecurrencePatternType.DAILY) {
            return true;
        }
        if (!schedule.getDaysOfWeek().isEmpty()) {
            return schedule.getDaysOfWeek().contains(date.getDayOfWeek());
        }
        if (schedule.getRecurrencePatternType() == RideRecurrencePatternType.CUSTOM
                && schedule.getIntervalDays() != null) {
            long daysBetween = ChronoUnit.DAYS.between(schedule.getStartDate(), date);
            return daysBetween >= 0 && daysBetween % schedule.getIntervalDays() == 0;
        }
        return false;
    }

    private void validateBusinessRules(RecurringRideSchedule schedule) {
        if (schedule.getEndDate() != null && schedule.getEndDate().isBefore(schedule.getStartDate())) {
            throw validationFailure("Recurring ride end date cannot be earlier than the start date.");
        }
        if (schedule.getScheduledDropoffTime() != null
                && schedule.getScheduledDropoffTime().isBefore(schedule.getScheduledPickupTime())) {
            throw validationFailure("Scheduled dropoff time cannot be earlier than scheduled pickup time.");
        }
        if (schedule.getTripType() == RideTripType.ONE_WAY) {
            if (schedule.getReturnPickupTime() != null || schedule.getReturnDropoffTime() != null) {
                throw validationFailure("Return trip times can only be provided for round-trip recurring schedules.");
            }
        } else {
            if (schedule.getReturnPickupTime() == null || schedule.getReturnDropoffTime() == null) {
                throw validationFailure(
                        "Return pickup and return dropoff times are required for round-trip recurring schedules.");
            }
            if (schedule.getScheduledDropoffTime() != null
                    && schedule.getReturnPickupTime().isBefore(schedule.getScheduledDropoffTime())) {
                throw validationFailure("Return pickup time cannot be earlier than scheduled dropoff time.");
            }
            if (schedule.getReturnDropoffTime().isBefore(schedule.getReturnPickupTime())) {
                throw validationFailure("Return dropoff time cannot be earlier than return pickup time.");
            }
        }
        if ((schedule.getRecurrencePatternType() == RideRecurrencePatternType.WEEKLY
                || schedule.getRecurrencePatternType() == RideRecurrencePatternType.CUSTOM)
                && schedule.getDaysOfWeek().isEmpty()
                && schedule.getIntervalDays() == null) {
            throw validationFailure("Weekly or custom recurring schedules require days of week or a custom interval.");
        }
        if (schedule.getRecurrencePatternType() == RideRecurrencePatternType.DAILY
                && schedule.getIntervalDays() != null) {
            throw validationFailure("Daily recurring schedules should not define a custom interval.");
        }
    }

    private void validateGeneratedRide(Ride ride) {
        if (ride.getTripType() == RideTripType.ROUND_TRIP
                && (ride.getReturnPickupAt() == null || ride.getReturnDropoffAt() == null)) {
            throw validationFailure("Generated round-trip rides must include return trip times.");
        }
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private void recordGeneratedRideAudit(Ride ride, RecurringRideSchedule schedule) {
        auditLogService.record(new AuditLogCommand(
                null,
                ride.getTenantId(),
                "RIDE",
                "GENERATED",
                "RIDE",
                ride.getId() == null ? ride.getRideNumber() : ride.getId().toString(),
                "Ride " + ride.getRideNumber() + " was generated from recurring schedule "
                        + schedule.getRecurrenceCode() + ".",
                null,
                Map.of(
                        "rideNumber", ride.getRideNumber(),
                        "recurrenceCode", schedule.getRecurrenceCode(),
                        "scheduledPickupAt", ride.getScheduledPickupAt(),
                        "status", ride.getStatus().name())));
    }

    private void recordAudit(RecurringRideSchedule schedule, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                schedule.getTenantId(),
                "RECURRING_RIDE",
                action,
                "RECURRING_RIDE",
                resolveEntityId(schedule),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(RecurringRideSchedule schedule) {
        if (schedule.getId() != null) {
            return schedule.getId().toString();
        }
        return schedule.getRecurrenceCode();
    }

    private Object snapshot(RecurringRideSchedule schedule) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", schedule.getId());
        values.put("recurrenceCode", schedule.getRecurrenceCode());
        values.put("riderId", schedule.getRider().getId());
        values.put("organizationId", schedule.getOrganization() == null ? null : schedule.getOrganization().getId());
        values.put("contractId", schedule.getContract() == null ? null : schedule.getContract().getId());
        values.put("serviceType", schedule.getServiceType() == null ? null : schedule.getServiceType().name());
        values.put("tripType", schedule.getTripType() == null ? null : schedule.getTripType().name());
        values.put("pattern",
                schedule.getRecurrencePatternType() == null ? null : schedule.getRecurrencePatternType().name());
        values.put("daysOfWeek", schedule.getDaysOfWeek());
        values.put("intervalDays", schedule.getIntervalDays());
        values.put("startDate", schedule.getStartDate());
        values.put("endDate", schedule.getEndDate());
        values.put("status", schedule.getStatus() == null ? null : schedule.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "recurrenceCode", "startDate", "endDate", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}