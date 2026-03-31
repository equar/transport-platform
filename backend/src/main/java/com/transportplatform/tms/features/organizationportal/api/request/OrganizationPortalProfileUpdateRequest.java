package com.transportplatform.tms.features.organizationportal.api.request;

import com.transportplatform.tms.features.organization.domain.OrganizationPreferredCommunicationMethod;
import jakarta.validation.constraints.Size;

public record OrganizationPortalProfileUpdateRequest(
        @Size(max = 100, message = "Title must be 100 characters or fewer.") String title,
        @Size(max = 100, message = "Department must be 100 characters or fewer.") String department,
        @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        OrganizationPreferredCommunicationMethod preferredCommunicationMethod,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}