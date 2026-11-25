package com.transportplatform.tms.features.driver.api.request;
import jakarta.validation.constraints.*;
public record DriverDocumentReviewRequest(@Size(max=2000) String notes, @NotNull Long version) {
    public DriverDocumentReviewRequest(String notes) { this(notes, null); }
}
