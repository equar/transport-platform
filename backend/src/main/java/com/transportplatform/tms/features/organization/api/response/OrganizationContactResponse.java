package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.organization.domain.OrganizationContactStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationPreferredCommunicationMethod;
import java.time.Instant;

public record OrganizationContactResponse(
        Long id,
        Long organizationId,
        String firstName,
        String lastName,
        String title,
        String department,
        String email,
        String phone,
        String alternatePhone,
        OrganizationPreferredCommunicationMethod preferredCommunicationMethod,
        boolean primary,
        String notes,
        OrganizationContactStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}