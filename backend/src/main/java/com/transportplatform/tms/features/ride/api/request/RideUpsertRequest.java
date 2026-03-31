package com.transportplatform.tms.features.ride.api.request;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideBillingType;
import com.transportplatform.tms.features.ride.domain.RidePriorityLevel;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record RideUpsertRequest(
        @NotNull(message = "Rider is required.") Long riderId,
        Long guardianId,
        Long organizationId,
        Long contractId,
        Long serviceAreaId,
        @NotNull(message = "Service type is required.") ServiceType serviceType,
        @NotNull(message = "Trip type is required.") RideTripType tripType,
        @NotBlank(message = "Pickup address line 1 is required.") @Size(max = 200, message = "Pickup address line 1 must be 200 characters or fewer.") String pickupAddressLine1,
        @Size(max = 200, message = "Pickup address line 2 must be 200 characters or fewer.") String pickupAddressLine2,
        @NotBlank(message = "Pickup city is required.") @Size(max = 100, message = "Pickup city must be 100 characters or fewer.") String pickupCity,
        @NotBlank(message = "Pickup state is required.") @Size(max = 100, message = "Pickup state must be 100 characters or fewer.") String pickupState,
        @NotBlank(message = "Pickup zip code is required.") @Size(max = 30, message = "Pickup zip code must be 30 characters or fewer.") String pickupZipCode,
        @NotBlank(message = "Pickup country is required.") @Size(max = 100, message = "Pickup country must be 100 characters or fewer.") String pickupCountry,
        @NotBlank(message = "Dropoff address line 1 is required.") @Size(max = 200, message = "Dropoff address line 1 must be 200 characters or fewer.") String dropoffAddressLine1,
        @Size(max = 200, message = "Dropoff address line 2 must be 200 characters or fewer.") String dropoffAddressLine2,
        @NotBlank(message = "Dropoff city is required.") @Size(max = 100, message = "Dropoff city must be 100 characters or fewer.") String dropoffCity,
        @NotBlank(message = "Dropoff state is required.") @Size(max = 100, message = "Dropoff state must be 100 characters or fewer.") String dropoffState,
        @NotBlank(message = "Dropoff zip code is required.") @Size(max = 30, message = "Dropoff zip code must be 30 characters or fewer.") String dropoffZipCode,
        @NotBlank(message = "Dropoff country is required.") @Size(max = 100, message = "Dropoff country must be 100 characters or fewer.") String dropoffCountry,
        @NotNull(message = "Scheduled pickup time is required.") LocalDateTime scheduledPickupAt,
        LocalDateTime scheduledDropoffAt,
        LocalDateTime returnPickupAt,
        LocalDateTime returnDropoffAt,
        boolean wheelchairRequired,
        boolean escortRequired,
        @Min(value = 0, message = "Companion count cannot be negative.") @Max(value = 10, message = "Companion count must be 10 or fewer.") Integer companionCount,
        @Size(max = 2000, message = "Special instructions must be 2000 characters or fewer.") String specialInstructions,
        @Size(max = 2000, message = "Internal notes must be 2000 characters or fewer.") String internalNotes,
        @Size(max = 2000, message = "Operational notes must be 2000 characters or fewer.") String operationalNotes,
        RidePriorityLevel priorityLevel,
        RideBillingType billingType,
        RideStatus status) {
}