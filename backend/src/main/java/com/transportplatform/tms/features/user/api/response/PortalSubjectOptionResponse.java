package com.transportplatform.tms.features.user.api.response;

import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;

public record PortalSubjectOptionResponse(
        Long id,
        PortalSubjectType type,
        String displayName,
        String firstName,
        String lastName,
        String reference,
        String email,
        String status,
        boolean linked) {
}
