package com.transportplatform.tms.features.organizationportal.api.response;

import java.time.Instant;

public record OrganizationPortalProfileResponse(
        Long contactId,
        Long organizationId,
        String organizationCode,
        String organizationName,
        String legalName,
        String organizationStatus,
        String primaryPhone,
        String primaryEmail,
        String website,
        String organizationAddress,
        String billingAddress,
        String firstName,
        String lastName,
        String title,
        String department,
        String email,
        String phone,
        String alternatePhone,
        String preferredCommunicationMethod,
        boolean primaryContact,
        String notes,
        String contactStatus,
        Instant updatedAt) {
}