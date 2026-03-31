package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import java.time.LocalDate;

public record RouteReportRowResponse(
        Long id,
        String routeCode,
        String routeName,
        RouteStatus status,
        ServiceType serviceType,
        LocalDate routeDate,
        String assignedDriverCode,
        String assignedVehicleCode) {
}