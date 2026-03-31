package com.transportplatform.tms.features.rider.api.response;

import com.transportplatform.tms.features.rider.domain.RiderGuardianRelationshipType;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;

public record GuardianLinkedRiderResponse(
        Long relationshipId,
        Long riderId,
        String riderCode,
        String riderDisplayName,
        RiderType riderType,
        RiderStatus riderStatus,
        boolean wheelchairRequired,
        boolean escortRequired,
        RiderGuardianRelationshipType relationshipType,
        boolean primaryGuardian,
        boolean authorizedForPickup,
        boolean billingContact,
        RiderGuardianStatus status,
        String notes) {
}