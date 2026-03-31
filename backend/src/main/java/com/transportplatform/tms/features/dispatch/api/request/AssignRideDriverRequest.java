package com.transportplatform.tms.features.dispatch.api.request;

import jakarta.validation.constraints.NotNull;

public record AssignRideDriverRequest(
        @NotNull Long driverId) {
}