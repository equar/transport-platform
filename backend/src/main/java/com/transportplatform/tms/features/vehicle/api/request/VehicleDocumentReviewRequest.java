package com.transportplatform.tms.features.vehicle.api.request;

import jakarta.validation.constraints.Size;

public record VehicleDocumentReviewRequest(
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}