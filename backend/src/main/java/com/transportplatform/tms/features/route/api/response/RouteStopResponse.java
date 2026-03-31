package com.transportplatform.tms.features.route.api.response;

import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.route.domain.RouteStopStatus;
import java.time.Instant;
import java.time.LocalDateTime;

public record RouteStopResponse(
        Long id,
        Long rideId,
        String rideNumber,
        String riderName,
        String organizationName,
        int stopSequence,
        LocalDateTime plannedPickupAt,
        LocalDateTime plannedDropoffAt,
        String pickupSummary,
        String dropoffSummary,
        boolean wheelchairRequired,
        boolean escortRequired,
        RideStatus rideStatus,
        String notes,
        RouteStopStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}