package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.api.request.RouteUpsertRequest;
import com.transportplatform.tms.features.route.api.response.RouteResponse;
import com.transportplatform.tms.features.route.api.response.RouteStopResponse;
import com.transportplatform.tms.features.route.api.response.RouteSummaryResponse;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RouteMapper {

    public void apply(Route route, RouteUpsertRequest request) {
        route.setRouteName(request.routeName().trim());
        route.setRouteDate(request.routeDate());
        route.setServiceType(request.serviceType());
        route.setStartTime(request.startTime());
        route.setEndTime(request.endTime());
        route.setManifestNotes(trimToNull(request.manifestNotes()));
        route.setNotes(trimToNull(request.notes()));
    }

    public RouteSummaryResponse toSummaryResponse(Route route,
            Driver assignedDriver,
            Vehicle assignedVehicle,
            long linkedRideCount) {
        return new RouteSummaryResponse(
                route.getId(),
                route.getRouteCode(),
                route.getRouteName(),
                route.getRouteDate(),
                route.getServiceType(),
                route.getAssignedDriverId(),
                assignedDriver == null ? null : formatDriverName(assignedDriver),
                route.getAssignedVehicleId(),
                assignedVehicle == null ? null : formatVehicleSummary(assignedVehicle),
                route.getStartTime(),
                route.getEndTime(),
                route.getNotes(),
                route.getStatus(),
                linkedRideCount,
                route.getCreatedBy(),
                route.getCreatedAt(),
                route.getUpdatedBy(),
                route.getUpdatedAt());
    }

    public RouteResponse toResponse(Route route,
            Driver assignedDriver,
            Vehicle assignedVehicle,
            long linkedRideCount,
            List<RouteStopResponse> stops) {
        return new RouteResponse(
                route.getId(),
                route.getTenantId(),
                route.getRouteCode(),
                route.getRouteName(),
                route.getRouteDate(),
                route.getServiceType(),
                route.getAssignedDriverId(),
                assignedDriver == null ? null : formatDriverName(assignedDriver),
                route.getAssignedVehicleId(),
                assignedVehicle == null ? null : formatVehicleSummary(assignedVehicle),
                route.getStartTime(),
                route.getEndTime(),
                route.getManifestNotes(),
                route.getNotes(),
                route.getStatus(),
                linkedRideCount,
                route.getCreatedBy(),
                route.getCreatedAt(),
                route.getUpdatedBy(),
                route.getUpdatedAt(),
                stops);
    }

    public RouteStopResponse toStopResponse(RouteStop routeStop) {
        return new RouteStopResponse(
                routeStop.getId(),
                routeStop.getRide().getId(),
                routeStop.getRide().getRideNumber(),
                formatRiderName(routeStop),
                routeStop.getRide().getOrganization() == null ? null : routeStop.getRide().getOrganization().getName(),
                routeStop.getStopSequence(),
                routeStop.getPlannedPickupAt(),
                routeStop.getPlannedDropoffAt(),
                formatAddressSummary(
                        routeStop.getRide().getPickupAddressLine1(),
                        routeStop.getRide().getPickupCity(),
                        routeStop.getRide().getPickupState(),
                        routeStop.getRide().getPickupZipCode()),
                formatAddressSummary(
                        routeStop.getRide().getDropoffAddressLine1(),
                        routeStop.getRide().getDropoffCity(),
                        routeStop.getRide().getDropoffState(),
                        routeStop.getRide().getDropoffZipCode()),
                routeStop.getRide().isWheelchairRequired(),
                routeStop.getRide().isEscortRequired(),
                routeStop.getRide().getStatus(),
                routeStop.getNotes(),
                routeStop.getStatus(),
                routeStop.getCreatedBy(),
                routeStop.getCreatedAt(),
                routeStop.getUpdatedBy(),
                routeStop.getUpdatedAt());
    }

    private String formatDriverName(Driver driver) {
        return ((driver.getFirstName() == null ? "" : driver.getFirstName().trim()) + " "
                + (driver.getLastName() == null ? "" : driver.getLastName().trim())).trim();
    }

    private String formatVehicleSummary(Vehicle vehicle) {
        return vehicle.getVehicleCode() + " · " + vehicle.getMake() + " " + vehicle.getModel();
    }

    private String formatRiderName(RouteStop routeStop) {
        return ((routeStop.getRide().getRider().getFirstName() == null ? ""
                : routeStop.getRide().getRider().getFirstName().trim()) + " "
                + (routeStop.getRide().getRider().getLastName() == null ? ""
                        : routeStop.getRide().getRider().getLastName().trim()))
                .trim();
    }

    private String formatAddressSummary(String line1, String city, String state, String zipCode) {
        StringBuilder builder = new StringBuilder();
        if (line1 != null && !line1.isBlank()) {
            builder.append(line1.trim());
        }
        if (city != null && !city.isBlank()) {
            if (builder.length() > 0) {
                builder.append(", ");
            }
            builder.append(city.trim());
        }
        if (state != null && !state.isBlank()) {
            if (builder.length() > 0) {
                builder.append(", ");
            }
            builder.append(state.trim());
        }
        if (zipCode != null && !zipCode.isBlank()) {
            builder.append(" ").append(zipCode.trim());
        }
        return builder.toString();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}