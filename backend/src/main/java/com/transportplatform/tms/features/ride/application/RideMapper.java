package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RideResponse;
import com.transportplatform.tms.features.ride.domain.Ride;
import org.springframework.stereotype.Component;

@Component
public class RideMapper {

    public void apply(Ride ride,
            RideUpsertRequest request,
            RideReferenceValidationService.ResolvedReferences references) {
        ride.setRider(references.rider());
        ride.setGuardian(references.guardian());
        ride.setOrganization(references.organization());
        ride.setContract(references.contract());
        ride.setServiceArea(references.serviceArea());
        ride.setServiceType(request.serviceType());
        ride.setTripType(request.tripType());
        ride.setPickupAddressLine1(request.pickupAddressLine1().trim());
        ride.setPickupAddressLine2(trimToNull(request.pickupAddressLine2()));
        ride.setPickupCity(request.pickupCity().trim());
        ride.setPickupState(request.pickupState().trim());
        ride.setPickupZipCode(request.pickupZipCode().trim());
        ride.setPickupCountry(request.pickupCountry().trim());
        ride.setDropoffAddressLine1(request.dropoffAddressLine1().trim());
        ride.setDropoffAddressLine2(trimToNull(request.dropoffAddressLine2()));
        ride.setDropoffCity(request.dropoffCity().trim());
        ride.setDropoffState(request.dropoffState().trim());
        ride.setDropoffZipCode(request.dropoffZipCode().trim());
        ride.setDropoffCountry(request.dropoffCountry().trim());
        ride.setScheduledPickupAt(request.scheduledPickupAt());
        ride.setScheduledDropoffAt(request.scheduledDropoffAt());
        ride.setReturnPickupAt(request.returnPickupAt());
        ride.setReturnDropoffAt(request.returnDropoffAt());
        ride.setWheelchairRequired(request.wheelchairRequired());
        ride.setEscortRequired(request.escortRequired());
        ride.setCompanionCount(request.companionCount() == null ? 0 : request.companionCount());
        ride.setSpecialInstructions(trimToNull(request.specialInstructions()));
        ride.setInternalNotes(trimToNull(request.internalNotes()));
        ride.setOperationalNotes(trimToNull(request.operationalNotes()));
        ride.setPriorityLevel(request.priorityLevel());
        ride.setBillingType(request.billingType());
    }

    public RideResponse toResponse(Ride ride) {
        return new RideResponse(
                ride.getId(),
                ride.getTenantId(),
                ride.getRideNumber(),
                ride.getRider().getId(),
                ride.getRider().getRiderCode(),
                formatRiderName(ride),
                ride.getGuardian() == null ? null : ride.getGuardian().getId(),
                ride.getGuardian() == null ? null : formatGuardianName(ride),
                ride.getOrganization() == null ? null : ride.getOrganization().getId(),
                ride.getOrganization() == null ? null : ride.getOrganization().getName(),
                ride.getContract() == null ? null : ride.getContract().getId(),
                ride.getContract() == null ? null : ride.getContract().getContractCode(),
                ride.getContract() == null ? null : ride.getContract().getContractName(),
                ride.getServiceArea() == null ? null : ride.getServiceArea().getId(),
                ride.getServiceArea() == null ? null : ride.getServiceArea().getName(),
                ride.getServiceType(),
                ride.getTripType(),
                ride.getPickupAddressLine1(),
                ride.getPickupAddressLine2(),
                ride.getPickupCity(),
                ride.getPickupState(),
                ride.getPickupZipCode(),
                ride.getPickupCountry(),
                ride.getDropoffAddressLine1(),
                ride.getDropoffAddressLine2(),
                ride.getDropoffCity(),
                ride.getDropoffState(),
                ride.getDropoffZipCode(),
                ride.getDropoffCountry(),
                ride.getScheduledPickupAt(),
                ride.getScheduledDropoffAt(),
                ride.getReturnPickupAt(),
                ride.getReturnDropoffAt(),
                ride.isWheelchairRequired(),
                ride.isEscortRequired(),
                ride.getCompanionCount(),
                ride.getSpecialInstructions(),
                ride.getInternalNotes(),
                ride.getOperationalNotes(),
                ride.getPriorityLevel(),
                ride.getBillingType(),
                ride.getDriverId(),
                ride.getVehicleId(),
                ride.getRouteId(),
                ride.getRecurrenceSchedule() == null ? null : ride.getRecurrenceSchedule().getId(),
                ride.getRecurrenceSchedule() == null ? null : ride.getRecurrenceSchedule().getRecurrenceCode(),
                ride.getCancellationReason(),
                ride.getCancelledAt(),
                ride.getCancelledBy(),
                ride.getStatus(),
                ride.getCreatedBy(),
                ride.getCreatedAt(),
                ride.getUpdatedBy(),
                ride.getUpdatedAt());
    }

    private String formatRiderName(Ride ride) {
        return ((ride.getRider().getFirstName() == null ? "" : ride.getRider().getFirstName().trim()) + " "
                + (ride.getRider().getLastName() == null ? "" : ride.getRider().getLastName().trim())).trim();
    }

    private String formatGuardianName(Ride ride) {
        return ((ride.getGuardian().getFirstName() == null ? "" : ride.getGuardian().getFirstName().trim()) + " "
                + (ride.getGuardian().getLastName() == null ? "" : ride.getGuardian().getLastName().trim())).trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}