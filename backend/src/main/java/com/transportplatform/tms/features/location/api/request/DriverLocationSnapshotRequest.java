package com.transportplatform.tms.features.location.api.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record DriverLocationSnapshotRequest(
        @NotNull(message = "Latitude is required.")
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90.")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90.")
        Double latitude,
        @NotNull(message = "Longitude is required.")
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180.")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180.")
        Double longitude,
        @DecimalMin(value = "0.0", message = "Accuracy cannot be negative.")
        Double accuracyMeters,
        Double speedMps,
        @DecimalMin(value = "0.0", message = "Heading cannot be negative.")
        @DecimalMax(value = "360.0", message = "Heading must not exceed 360 degrees.")
        Double headingDegrees,
        Instant capturedAt) {
}
