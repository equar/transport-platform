package com.transportplatform.tms.features.rider.api.response;

import com.transportplatform.tms.features.rider.domain.GuardianPreferredCommunicationMethod;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import java.time.Instant;
import java.util.List;

public record GuardianResponse(
        Long id,
        String tenantId,
        String firstName,
        String middleName,
        String lastName,
        String relationToRiderDefault,
        String email,
        String phone,
        String alternatePhone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        GuardianPreferredCommunicationMethod preferredCommunicationMethod,
        boolean billingContact,
        boolean authorizedForPickup,
        String notes,
        GuardianStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        long linkedRiderCount,
        List<GuardianLinkedRiderResponse> riders) {
}