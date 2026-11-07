package com.transportplatform.tms.features.user.api.response;

import java.time.Instant;
import java.util.Set;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;

public record UserResponse(
        Long id,
        String tenantId,
        String firstName,
        String lastName,
        String email,
        String status,
        Set<String> roles,
        PortalSubjectType portalSubjectType,
        Long portalSubjectId,
        Instant lastLoginAt,
        Instant createdAt,
        Instant updatedAt) {
}
