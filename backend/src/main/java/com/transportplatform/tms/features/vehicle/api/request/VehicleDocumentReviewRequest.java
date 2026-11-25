package com.transportplatform.tms.features.vehicle.api.request;
import jakarta.validation.constraints.*;
public record VehicleDocumentReviewRequest(@Size(max=2000) String notes, @NotNull Long version) {
    public VehicleDocumentReviewRequest(String notes) { this(notes, null); }
}
