package com.transportplatform.tms.features.ride.api.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GenerateRecurringRideInstancesRequest(
        @NotNull(message = "From date is required.") LocalDate fromDate,
        @NotNull(message = "To date is required.") LocalDate toDate) {
}