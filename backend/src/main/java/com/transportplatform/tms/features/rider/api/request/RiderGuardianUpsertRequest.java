package com.transportplatform.tms.features.rider.api.request;

import com.transportplatform.tms.features.rider.domain.RiderGuardianRelationshipType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RiderGuardianUpsertRequest(
        @NotNull(message = "Guardian is required.") Long guardianId,
        @NotNull(message = "Relationship type is required.") RiderGuardianRelationshipType relationshipType,
        boolean primaryGuardian,
        boolean authorizedForPickup,
        boolean billingContact,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}