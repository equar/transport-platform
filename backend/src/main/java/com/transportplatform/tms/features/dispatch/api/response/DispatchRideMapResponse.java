package com.transportplatform.tms.features.dispatch.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import java.time.Instant;
import java.time.LocalDateTime;

public record DispatchRideMapResponse(
        Long rideId,
        String rideNumber,
        String riderName,
        String driverName,
        String vehicleDisplayName,
        ServiceType serviceType,
        RideStatus status,
        String pickupAddress,
        String dropoffAddress,
        LocalDateTime scheduledPickupAt,
        Double latitude,
        Double longitude,
        Double accuracyMeters,
        Double speedMps,
        Double headingDegrees,
        Instant capturedAt) {
}
