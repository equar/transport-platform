package com.transportplatform.tms.features.driver.api.request;

import jakarta.validation.constraints.Size;

public record DriverDocumentReviewRequest(
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}