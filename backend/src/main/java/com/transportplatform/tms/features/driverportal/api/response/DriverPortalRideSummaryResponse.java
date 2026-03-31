package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.LocalDateTime;

public record DriverPortalRideSummaryResponse(
        Long id,
        String rideNumber,
        RideStatus status,
        ServiceType serviceType,
        RideTripType tripType,
        LocalDateTime scheduledPickupAt,
        LocalDateTime scheduledDropoffAt,
        String riderName,
        String guardianName,
        String organizationName,
        String pickupAddress,
        String dropoffAddress,
        Long routeId) {
}