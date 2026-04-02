package com.transportplatform.tms.features.auth.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank(message = "Workspace ID is required.") @Size(max = 50, message = "Workspace ID must be 50 characters or fewer.") String tenantId,
        @NotBlank(message = "Email is required.") @Email(message = "Email must be valid.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email) {
}