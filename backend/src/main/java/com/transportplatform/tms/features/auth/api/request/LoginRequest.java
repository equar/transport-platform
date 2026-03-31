package com.transportplatform.tms.features.auth.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @Size(max = 36, message = "Tenant identifier must be 36 characters or fewer.") String tenantId,
        @Email(message = "A valid email address is required.") @NotBlank(message = "Email is required.") String email,
        @NotBlank(message = "Password is required.") String password) {
}
