package com.transportplatform.tms.features.incident.api.response;

import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import java.time.Instant;

public record IncidentDetailResponse(
        Long id,
        String tenantId,
        String incidentCode,
        IncidentType incidentType,
        IncidentSeverity severity,
        String title,
        String description,
        Instant reportedAt,
        Long reportedByUserId,
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
        Long relatedGuardianId,
        String relatedGuardianName,
        Long relatedOrganizationId,
        String relatedOrganizationName,
        String resolutionSummary,
        String rootCauseSummary,
        String correctiveActionSummary,
        String notes,
        IncidentStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}