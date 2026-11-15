package com.transportplatform.tms.features.route.api.request;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record RouteUpsertRequest(
        @NotBlank(message = "Route name is required.") @Size(max = 150, message = "Route name must be 150 characters or fewer.") String routeName,
        @NotNull(message = "Route date is required.") LocalDate routeDate,
        @NotNull(message = "Service type is required.") ServiceType serviceType,
        @DecimalMin(value = "0.00", message = "Route price cannot be negative.") @DecimalMax(value = "9999999999.99", message = "Route price is too large.") @Digits(integer = 10, fraction = 2, message = "Route price must have at most 2 decimal places.") BigDecimal price,
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 2000, message = "Manifest notes must be 2000 characters or fewer.") String manifestNotes,
        @Size(max = 2000, message = "Route notes must be 2000 characters or fewer.") String notes,
        RouteStatus status) {
}