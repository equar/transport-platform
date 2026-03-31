package com.transportplatform.tms.features.incident.api.response;

import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import java.time.Instant;

public record IncidentSummaryResponse(
        Long id,
        String incidentCode,
        IncidentType incidentType,
        IncidentSeverity severity,
        String title,
        Instant reportedAt,
        String reportedByNameSnapshot,
        Long assignedToUserId,
        String assignedToName,
        Long relatedRideId,
        String relatedRideCode,
        Long relatedDriverId,
        String relatedDriverCode,
        Long relatedVehicleId,
        String relatedVehicleCode,
        Long relatedRiderId,
        String relatedRiderCode,
        Long relatedOrganizationId,
        String relatedOrganizationName,
        IncidentStatus status,
        Instant createdAt,
        Instant updatedAt) {
}