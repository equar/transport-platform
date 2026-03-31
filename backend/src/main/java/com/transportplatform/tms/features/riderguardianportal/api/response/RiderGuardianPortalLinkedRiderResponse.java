package com.transportplatform.tms.features.riderguardianportal.api.response;

public record RiderGuardianPortalLinkedRiderResponse(
        Long id,
        String riderCode,
        String riderDisplayName,
        String relationshipType,
        boolean primaryGuardian,
        boolean authorizedForPickup,
        boolean billingContact,
        String status,
        boolean wheelchairRequired,
        boolean escortRequired) {
}