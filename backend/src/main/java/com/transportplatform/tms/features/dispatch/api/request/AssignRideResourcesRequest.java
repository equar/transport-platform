package com.transportplatform.tms.features.dispatch.api.request;

public record AssignRideResourcesRequest(
        Long driverId,
        Long vehicleId) {
}