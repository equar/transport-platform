package com.transportplatform.tms.features.tenant.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record TenantUpsertRequest(
        @NotBlank(message = "Tenant code is required.") @Size(max = 50, message = "Tenant code must be 50 characters or fewer.") String tenantCode,
        @NotBlank(message = "Company name is required.") @Size(max = 150, message = "Company name must be 150 characters or fewer.") String companyName,
        @NotBlank(message = "Legal name is required.") @Size(max = 150, message = "Legal name must be 150 characters or fewer.") String legalName,
        @Email(message = "A valid email address is required.") @NotBlank(message = "Email is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @NotBlank(message = "Phone is required.") @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @NotBlank(message = "Address line 1 is required.") @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @NotBlank(message = "City is required.") @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @NotBlank(message = "State is required.") @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @NotBlank(message = "ZIP code is required.") @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @NotBlank(message = "Country is required.") @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @NotBlank(message = "Business type is required.") @Size(max = 100, message = "Business type must be 100 characters or fewer.") String businessType,
        @NotBlank(message = "Subscription plan is required.") @Size(max = 50, message = "Subscription plan must be 50 characters or fewer.") String subscriptionPlan,
        @NotEmpty(message = "At least one service type must be enabled.") Set<@NotBlank(message = "Service type is required.") String> serviceTypesEnabled,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}
