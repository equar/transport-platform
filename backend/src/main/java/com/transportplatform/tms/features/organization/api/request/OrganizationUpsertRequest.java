package com.transportplatform.tms.features.organization.api.request;

import com.transportplatform.tms.features.organization.domain.OrganizationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrganizationUpsertRequest(
        @NotNull(message = "Organization type is required.") OrganizationType organizationType,
        @NotBlank(message = "Organization name is required.") @Size(max = 150, message = "Organization name must be 150 characters or fewer.") String name,
        @Size(max = 200, message = "Legal name must be 200 characters or fewer.") String legalName,
        @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @Size(max = 200, message = "Billing address line 1 must be 200 characters or fewer.") String billingAddressLine1,
        @Size(max = 200, message = "Billing address line 2 must be 200 characters or fewer.") String billingAddressLine2,
        @Size(max = 100, message = "Billing city must be 100 characters or fewer.") String billingCity,
        @Size(max = 100, message = "Billing state must be 100 characters or fewer.") String billingState,
        @Size(max = 30, message = "Billing ZIP code must be 30 characters or fewer.") String billingZipCode,
        @Size(max = 100, message = "Billing country must be 100 characters or fewer.") String billingCountry,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Primary phone must be a valid phone number.") @Size(max = 50, message = "Primary phone must be 50 characters or fewer.") String primaryPhone,
        @Email(message = "A valid email address is required.") @Size(max = 150, message = "Primary email must be 150 characters or fewer.") String primaryEmail,
        @Size(max = 200, message = "Website must be 200 characters or fewer.") String website,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}