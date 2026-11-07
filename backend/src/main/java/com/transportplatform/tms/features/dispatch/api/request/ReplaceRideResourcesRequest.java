package com.transportplatform.tms.features.dispatch.api.request;
public record ReplaceRideResourcesRequest(Long driverId, Long vehicleId,
    @jakarta.validation.constraints.NotNull Long expectedVersion) {}
