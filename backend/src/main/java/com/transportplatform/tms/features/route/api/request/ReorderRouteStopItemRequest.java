package com.transportplatform.tms.features.route.api.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReorderRouteStopItemRequest(
        @NotNull(message = "Route stop is required.") Long routeStopId,
        @NotNull(message = "Stop sequence is required.") @Positive(message = "Stop sequence must be positive.") Integer stopSequence) {
}