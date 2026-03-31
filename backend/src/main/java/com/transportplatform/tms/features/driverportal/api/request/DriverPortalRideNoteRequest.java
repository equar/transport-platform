package com.transportplatform.tms.features.driverportal.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DriverPortalRideNoteRequest(
        @NotBlank(message = "Ride note is required.") @Size(max = 2000, message = "Ride note must be 2000 characters or fewer.") String note) {
}