package com.transportplatform.tms.features.driverearnings.api.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record DriverEarningsReviewRequest(
        @NotNull @DecimalMin("0.00") @DecimalMax("999999.99") BigDecimal amount,
        @NotBlank @Size(max = 1000) String reason) {
}
