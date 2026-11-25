package com.transportplatform.tms.features.driverearnings.api.request;
import jakarta.validation.constraints.*; import java.math.BigDecimal;
public record DriverEarningsRateRequest(@NotNull @DecimalMin("0.00") @DecimalMax("100.00") @jakarta.validation.constraints.Digits(integer=3,fraction=2) BigDecimal rate) {}
