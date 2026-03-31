package com.transportplatform.tms.features.organization.api.request;

import com.transportplatform.tms.features.organization.domain.OrganizationPreferredCommunicationMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrganizationContactUpsertRequest(
        @NotBlank(message = "First name is required.") @Size(max = 100, message = "First name must be 100 characters or fewer.") String firstName,
        @NotBlank(message = "Last name is required.") @Size(max = 100, message = "Last name must be 100 characters or fewer.") String lastName,
        @Size(max = 100, message = "Title must be 100 characters or fewer.") String title,
        @Size(max = 100, message = "Department must be 100 characters or fewer.") String department,
        @Email(message = "A valid email address is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Phone must be a valid phone number.") @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Alternate phone must be a valid phone number.") @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        OrganizationPreferredCommunicationMethod preferredCommunicationMethod,
        boolean primary,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}