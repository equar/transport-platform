package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.route.domain.RouteStopStatus;
import java.time.LocalDateTime;

public record DriverPortalRouteStopResponse(
        Long id,
        int stopSequence,
        RouteStopStatus status,
        Long rideId,
        String rideNumber,
        String riderName,
        LocalDateTime plannedPickupAt,
        LocalDateTime plannedDropoffAt,
        String pickupAddress,
        String dropoffAddress) {
}