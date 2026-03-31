package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;

public record OrganizationLinkedRiderResponse(
        Long id,
        String riderCode,
        String riderDisplayName,
        RiderType riderType,
        RiderStatus status,
        boolean wheelchairRequired,
        boolean escortRequired) {
}