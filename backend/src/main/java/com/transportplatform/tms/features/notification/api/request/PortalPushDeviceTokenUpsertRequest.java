package com.transportplatform.tms.features.notification.api.request;

import jakarta.validation.constraints.NotBlank;

public record PortalPushDeviceTokenUpsertRequest(
        @NotBlank(message = "Push token is required.") String token,
        @NotBlank(message = "Platform is required.") String platform) {
}
