package com.transportplatform.tms.features.notification.api.request;

import jakarta.validation.constraints.NotBlank;

public record PortalPushDeviceTokenDeleteRequest(
        @NotBlank(message = "Push token is required.") String token) {
}
