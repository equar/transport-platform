package com.transportplatform.tms.features.location.api.response;

import java.time.Instant;

public record DriverLocationSnapshotResponse(
        Long id,
        Long rideId,
        Long driverId,
        Long vehicleId,
        Double latitude,
        Double longitude,
        Double accuracyMeters,
        Double speedMps,
        Double headingDegrees,
        Instant capturedAt,
        Instant createdAt,
        String createdBy) {
}
