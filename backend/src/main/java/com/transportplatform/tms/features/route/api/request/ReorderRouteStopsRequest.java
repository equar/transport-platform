package com.transportplatform.tms.features.route.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderRouteStopsRequest(
        @NotEmpty(message = "Stop order is required.") List<@Valid ReorderRouteStopItemRequest> items) {
}