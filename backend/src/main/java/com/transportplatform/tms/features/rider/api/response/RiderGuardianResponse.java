package com.transportplatform.tms.features.rider.api.response;

import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRelationshipType;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import java.time.Instant;

public record RiderGuardianResponse(
        Long id,
        Long riderId,
        Long guardianId,
        String guardianFirstName,
        String guardianLastName,
        String guardianDisplayName,
        String guardianEmail,
        String guardianPhone,
        GuardianStatus guardianStatus,
        RiderGuardianRelationshipType relationshipType,
        boolean primaryGuardian,
        boolean authorizedForPickup,
        boolean billingContact,
        RiderGuardianStatus status,
        String notes,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}