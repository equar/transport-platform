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
            boolean mustChangePassword,
            boolean mfaEnrollmentRequired,
            boolean subscriptionRecovery,
            Set<String> roles) {
        public AuthenticatedUserResponse(Long id, String email, String firstName, String lastName, String tenantId,
                String status, boolean mustChangePassword, boolean mfaEnrollmentRequired, Set<String> roles) {
            this(id, email, firstName, lastName, tenantId, status, mustChangePassword, mfaEnrollmentRequired, false, roles);
        }
    }
}
