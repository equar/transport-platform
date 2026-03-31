package com.transportplatform.tms.features.ride.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelRideRequest(
        @NotBlank(message = "Cancellation reason is required.") @Size(max = 1000, message = "Cancellation reason must be 1000 characters or fewer.") String reason) {
}