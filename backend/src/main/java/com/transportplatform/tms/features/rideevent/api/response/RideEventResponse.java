package com.transportplatform.tms.features.rideevent.api.response;

import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rideevent.domain.RideEventType;
import java.time.Instant;

public record RideEventResponse(
        Long id,
        Long rideId,
        RideEventType eventType,
        Long actorUserId,
        String actorName,
        String actorEmail,
        RideStatus previousStatus,
        RideStatus newStatus,
        String notes,
        Instant createdAt) {
}