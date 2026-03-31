package com.transportplatform.tms.features.route.api.request;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record RouteUpsertRequest(
        @NotBlank(message = "Route name is required.") @Size(max = 150, message = "Route name must be 150 characters or fewer.") String routeName,
        @NotNull(message = "Route date is required.") LocalDate routeDate,
        @NotNull(message = "Service type is required.") ServiceType serviceType,
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 2000, message = "Manifest notes must be 2000 characters or fewer.") String manifestNotes,
        @Size(max = 2000, message = "Route notes must be 2000 characters or fewer.") String notes,
        RouteStatus status) {
}