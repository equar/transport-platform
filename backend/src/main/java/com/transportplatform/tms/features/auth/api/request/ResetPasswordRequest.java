package com.transportplatform.tms.features.auth.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "A password reset token is required.") @Size(max = 255, message = "The password reset token is too long.") String token,
        @NotBlank(message = "A new password is required.") @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters.") String password) {
}