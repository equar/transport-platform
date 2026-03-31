package com.transportplatform.tms.features.route.api.request;

public record AssignRouteResourcesRequest(
        Long driverId,
        Long vehicleId) {
}