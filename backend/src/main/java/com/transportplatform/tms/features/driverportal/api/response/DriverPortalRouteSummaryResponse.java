package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record DriverPortalRouteSummaryResponse(
        Long id,
        String routeCode,
        String routeName,
        LocalDate routeDate,
        ServiceType serviceType,
        RouteStatus status,
        LocalTime startTime,
        LocalTime endTime,
        long linkedRideCount) {
}