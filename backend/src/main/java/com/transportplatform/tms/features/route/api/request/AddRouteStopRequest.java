package com.transportplatform.tms.features.route.api.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record AddRouteStopRequest(
        @NotNull(message = "Ride is required.") Long rideId,
        @Positive(message = "Stop sequence must be positive when provided.") Integer stopSequence,
        LocalDateTime plannedPickupAt,
        LocalDateTime plannedDropoffAt,
        @Size(max = 1000, message = "Stop notes must be 1000 characters or fewer.") String notes) {
}