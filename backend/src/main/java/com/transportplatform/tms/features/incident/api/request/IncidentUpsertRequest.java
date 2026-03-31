package com.transportplatform.tms.features.incident.api.request;

import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record IncidentUpsertRequest(
        @NotNull(message = "Incident type is required.") IncidentType incidentType,
        @NotNull(message = "Incident severity is required.") IncidentSeverity severity,
        IncidentStatus status,
        @NotBlank(message = "Incident title is required.") @Size(max = 200, message = "Incident title must be 200 characters or fewer.") String title,
        @NotBlank(message = "Incident description is required.") @Size(max = 4000, message = "Incident description must be 4000 characters or fewer.") String description,
        Instant reportedAt,
        @Size(max = 150, message = "Reported by name must be 150 characters or fewer.") String reportedByNameSnapshot,
        Long relatedRideId,
        Long relatedDriverId,
        Long relatedVehicleId,
        Long relatedRiderId,
        Long relatedGuardianId,
        Long relatedOrganizationId,
        Long assignedToUserId,
        @Size(max = 2000, message = "Resolution summary must be 2000 characters or fewer.") String resolutionSummary,
        @Size(max = 2000, message = "Root cause summary must be 2000 characters or fewer.") String rootCauseSummary,
        @Size(max = 2000, message = "Corrective action summary must be 2000 characters or fewer.") String correctiveActionSummary,
        @Size(max = 4000, message = "Notes must be 4000 characters or fewer.") String notes) {
}