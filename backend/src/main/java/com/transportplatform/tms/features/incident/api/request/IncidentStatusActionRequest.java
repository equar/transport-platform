package com.transportplatform.tms.features.incident.api.request;

import jakarta.validation.constraints.Size;

public record IncidentStatusActionRequest(
        @Size(max = 2000, message = "Resolution summary must be 2000 characters or fewer.") String resolutionSummary,
        @Size(max = 2000, message = "Root cause summary must be 2000 characters or fewer.") String rootCauseSummary,
        @Size(max = 2000, message = "Corrective action summary must be 2000 characters or fewer.") String correctiveActionSummary,
        @Size(max = 4000, message = "Notes must be 4000 characters or fewer.") String notes) {
}