package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import java.time.Instant;

public record IncidentReportRowResponse(
        Long id,
        String incidentCode,
        IncidentType incidentType,
        IncidentSeverity severity,
        IncidentStatus status,
        String title,
        Instant reportedAt,
        String assignedToName,
        String relatedRideCode,
        String relatedDriverCode,
        String relatedVehicleCode,
        Instant updatedAt) {
}