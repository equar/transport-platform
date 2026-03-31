package com.transportplatform.tms.features.rider.api.request;

import com.transportplatform.tms.features.rider.domain.GuardianPreferredCommunicationMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GuardianUpsertRequest(
        @NotBlank(message = "First name is required.") @Size(max = 100, message = "First name must be 100 characters or fewer.") String firstName,
        @Size(max = 100, message = "Middle name must be 100 characters or fewer.") String middleName,
        @NotBlank(message = "Last name is required.") @Size(max = 100, message = "Last name must be 100 characters or fewer.") String lastName,
        @Size(max = 100, message = "Default relationship must be 100 characters or fewer.") String relationToRiderDefault,
        @Email(message = "A valid email address is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @NotBlank(message = "Phone is required.") @Pattern(regexp = "^[0-9+()\\-\\s]{7,50}$", message = "Phone must be a valid phone number.") @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Alternate phone must be a valid phone number.") @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        GuardianPreferredCommunicationMethod preferredCommunicationMethod,
        boolean billingContact,
        boolean authorizedForPickup,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}