package com.transportplatform.tms.features.dispatch.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public record DispatchRideSummaryResponse(
        Long rideId,
        String rideNumber,
        Long riderId,
        String riderCode,
        String riderName,
        Long organizationId,
        String organizationName,
        ServiceType serviceType,
        RideStatus status,
        LocalDateTime scheduledPickupAt,
        LocalDateTime scheduledDropoffAt,
        String pickupAddress,
        String dropoffAddress,
        Long driverId,
        String driverCode,
        String driverName,
        Long vehicleId,
        String vehicleCode,
        String vehicleDisplayName,
        Long routeId,
        boolean complianceWarning,
        boolean conflictWarning,
        List<String> warningMessages,
        Instant updatedAt) {
}