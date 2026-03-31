package com.transportplatform.tms.features.route.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record RouteResponse(
        Long id,
        String tenantId,
        String routeCode,
        String routeName,
        LocalDate routeDate,
        ServiceType serviceType,
        Long assignedDriverId,
        String assignedDriverName,
        Long assignedVehicleId,
        String assignedVehicleSummary,
        LocalTime startTime,
        LocalTime endTime,
        String manifestNotes,
        String notes,
        RouteStatus status,
        long linkedRideCount,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        List<RouteStopResponse> stops) {
}