package com.transportplatform.tms.features.auth.api.response;

import java.util.Set;

public record AuthTokensResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        AuthenticatedUserResponse user) {

    public record AuthenticatedUserResponse(
            Long id,
            String email,
            String firstName,
            String lastName,
            String tenantId,
            String status,
            Set<String> roles) {
    }
}
