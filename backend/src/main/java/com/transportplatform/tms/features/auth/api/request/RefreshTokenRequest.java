package com.transportplatform.tms.features.auth.api.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required.") String refreshToken) {
}
