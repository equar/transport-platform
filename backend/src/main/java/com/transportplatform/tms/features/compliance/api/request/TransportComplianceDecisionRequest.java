package com.transportplatform.tms.features.compliance.api.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TransportComplianceDecisionRequest(
        @NotNull Boolean approved,
        @Size(max = 2000) String notes) {}

