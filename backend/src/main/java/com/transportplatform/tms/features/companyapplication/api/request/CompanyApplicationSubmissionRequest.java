package com.transportplatform.tms.features.companyapplication.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CompanyApplicationSubmissionRequest(
        @NotBlank(message = "Legal company name is required.") @Size(max = 150, message = "Legal company name must be 150 characters or fewer.") String legalCompanyName,
        @Size(max = 150, message = "DBA name must be 150 characters or fewer.") String dbaName,
        @NotBlank(message = "Contact first name is required.") @Size(max = 100, message = "Contact first name must be 100 characters or fewer.") String contactFirstName,
        @NotBlank(message = "Contact last name is required.") @Size(max = 100, message = "Contact last name must be 100 characters or fewer.") String contactLastName,
        @Email(message = "A valid email address is required.") @NotBlank(message = "Email is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @NotBlank(message = "Phone is required.") @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @NotBlank(message = "Business type is required.") @Size(max = 100, message = "Business type must be 100 characters or fewer.") String businessType,
        @NotBlank(message = "Address line 1 is required.") @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @NotBlank(message = "City is required.") @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @NotBlank(message = "State is required.") @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @NotBlank(message = "ZIP code is required.") @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @NotBlank(message = "Country is required.") @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @NotEmpty(message = "At least one requested service type is required.") Set<@NotBlank(message = "Requested service type is required.") String> requestedServiceTypes,
        @Min(value = 0, message = "Fleet size cannot be negative.") Integer fleetSize,
        @Min(value = 0, message = "Number of drivers cannot be negative.") Integer numberOfDrivers,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}
