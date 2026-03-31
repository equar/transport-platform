package com.transportplatform.tms.features.riderguardianportal.api.response;

import java.time.Instant;

public record RiderGuardianPortalProfileResponse(
        String scopeType,
        Long id,
        String code,
        String firstName,
        String lastName,
        String email,
        String phone,
        String alternatePhone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        String defaultPickupAddress,
        String defaultDropoffAddress,
        String pickupNotes,
        String dropoffNotes,
        String specialInstructions,
        String emergencyContactName,
        String emergencyContactPhone,
        String emergencyContactRelationship,
        String preferredCommunicationMethod,
        String notes,
        String status,
        Instant updatedAt) {
}