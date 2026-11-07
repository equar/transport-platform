package com.transportplatform.tms.common.security;

import java.time.Instant;
import java.util.Set;

public record JwtClaims(
        Long userId,
        String subject,
        String firstName,
        String lastName,
        String tenantId,
        Set<String> roles,
        Boolean mustChangePassword,
        String tokenType,
        Instant issuedAt,
        Instant expiresAt, long securityVersion) {
    public JwtClaims(Long userId, String subject, String firstName, String lastName, String tenantId,
            Set<String> roles, Boolean mustChangePassword, String tokenType, Instant issuedAt, Instant expiresAt) {
        this(userId, subject, firstName, lastName, tenantId, roles, mustChangePassword, tokenType, issuedAt, expiresAt, 0L);
    }
}
