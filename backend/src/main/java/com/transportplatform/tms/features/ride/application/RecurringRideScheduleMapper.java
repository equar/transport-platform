package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.features.ride.api.request.RecurringRideScheduleUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RecurringRideScheduleResponse;
import com.transportplatform.tms.features.ride.domain.RecurringRideSchedule;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class RecurringRideScheduleMapper {

    public void apply(RecurringRideSchedule schedule,
            RecurringRideScheduleUpsertRequest request,
            RideReferenceValidationService.ResolvedReferences references) {
        schedule.setRider(references.rider());
        schedule.setGuardian(references.guardian());
        schedule.setOrganization(references.organization());
        schedule.setContract(references.contract());
        schedule.setServiceArea(references.serviceArea());
        schedule.setServiceType(request.serviceType());
        schedule.setTripType(request.tripType());
        schedule.setPickupAddressLine1(request.pickupAddressLine1().trim());
        schedule.setPickupAddressLine2(trimToNull(request.pickupAddressLine2()));
        schedule.setPickupCity(request.pickupCity().trim());
        schedule.setPickupState(request.pickupState().trim());
        schedule.setPickupZipCode(request.pickupZipCode().trim());
        schedule.setPickupCountry(request.pickupCountry().trim());
        schedule.setDropoffAddressLine1(request.dropoffAddressLine1().trim());
        schedule.setDropoffAddressLine2(trimToNull(request.dropoffAddressLine2()));
        schedule.setDropoffCity(request.dropoffCity().trim());
        schedule.setDropoffState(request.dropoffState().trim());
        schedule.setDropoffZipCode(request.dropoffZipCode().trim());
        schedule.setDropoffCountry(request.dropoffCountry().trim());
        schedule.setScheduledPickupTime(request.scheduledPickupTime());
        schedule.setScheduledDropoffTime(request.scheduledDropoffTime());
        schedule.setReturnPickupTime(request.returnPickupTime());
        schedule.setReturnDropoffTime(request.returnDropoffTime());
        schedule.setRecurrencePatternType(request.recurrencePatternType());
        schedule.setDaysOfWeek(
                request.daysOfWeek() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(request.daysOfWeek()));
        schedule.setIntervalDays(request.intervalDays());
        schedule.setStartDate(request.startDate());
        schedule.setEndDate(request.endDate());
        schedule.setOccurrenceLimit(request.occurrenceLimit());
        schedule.setSkipDates(
                request.skipDates() == null ? new LinkedHashSet<>() : normalizeDates(request.skipDates()));
        schedule.setWheelchairRequired(request.wheelchairRequired());
        schedule.setEscortRequired(request.escortRequired());
        schedule.setCompanionCount(request.companionCount() == null ? 0 : request.companionCount());
        schedule.setSpecialInstructions(trimToNull(request.specialInstructions()));
        schedule.setInternalNotes(trimToNull(request.internalNotes()));
        schedule.setBillingType(request.billingType());
    }

    public RecurringRideScheduleResponse toResponse(RecurringRideSchedule schedule, long generatedRideCount) {
        return new RecurringRideScheduleResponse(
                schedule.getId(),
                schedule.getTenantId(),
                schedule.getRecurrenceCode(),
                schedule.getRider().getId(),
                schedule.getRider().getRiderCode(),
                formatRiderName(schedule),
                schedule.getGuardian() == null ? null : schedule.getGuardian().getId(),
                schedule.getGuardian() == null ? null : formatGuardianName(schedule),
                schedule.getOrganization() == null ? null : schedule.getOrganization().getId(),
                schedule.getOrganization() == null ? null : schedule.getOrganization().getName(),
                schedule.getContract() == null ? null : schedule.getContract().getId(),
                schedule.getContract() == null ? null : schedule.getContract().getContractCode(),
                schedule.getContract() == null ? null : schedule.getContract().getContractName(),
                schedule.getServiceArea() == null ? null : schedule.getServiceArea().getId(),
                schedule.getServiceArea() == null ? null : schedule.getServiceArea().getName(),
                schedule.getServiceType(),
                schedule.getTripType(),
                schedule.getPickupAddressLine1(),
                schedule.getPickupAddressLine2(),
                schedule.getPickupCity(),
                schedule.getPickupState(),
                schedule.getPickupZipCode(),
                schedule.getPickupCountry(),
                schedule.getDropoffAddressLine1(),
                schedule.getDropoffAddressLine2(),
                schedule.getDropoffCity(),
                schedule.getDropoffState(),
                schedule.getDropoffZipCode(),
                schedule.getDropoffCountry(),
                schedule.getScheduledPickupTime(),
                schedule.getScheduledDropoffTime(),
                schedule.getReturnPickupTime(),
                schedule.getReturnDropoffTime(),
                schedule.getRecurrencePatternType(),
                Set.copyOf(schedule.getDaysOfWeek()),
                schedule.getIntervalDays(),
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.getOccurrenceLimit(),
                Set.copyOf(schedule.getSkipDates()),
                schedule.isWheelchairRequired(),
                schedule.isEscortRequired(),
                schedule.getCompanionCount(),
                schedule.getSpecialInstructions(),
                schedule.getInternalNotes(),
                schedule.getBillingType(),
                schedule.getStatus(),
                schedule.getCreatedBy(),
                schedule.getCreatedAt(),
                schedule.getUpdatedBy(),
                schedule.getUpdatedAt(),
                generatedRideCount);
    }

    private Set<LocalDate> normalizeDates(Set<LocalDate> values) {
        LinkedHashSet<LocalDate> normalized = new LinkedHashSet<>();
        for (LocalDate value : values) {
            if (value != null) {
                normalized.add(value);
            }
        }
        return normalized;
    }

    private String formatRiderName(RecurringRideSchedule schedule) {
        return ((schedule.getRider().getFirstName() == null ? "" : schedule.getRider().getFirstName().trim()) + " "
                + (schedule.getRider().getLastName() == null ? "" : schedule.getRider().getLastName().trim())).trim();
    }

    private String formatGuardianName(RecurringRideSchedule schedule) {
        return ((schedule.getGuardian().getFirstName() == null ? "" : schedule.getGuardian().getFirstName().trim())
                + " "
                + (schedule.getGuardian().getLastName() == null ? "" : schedule.getGuardian().getLastName().trim()))
                .trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}