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
        String tokenType,
        Instant issuedAt,
        Instant expiresAt) {
}
