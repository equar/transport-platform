package com.transportplatform.tms.common.security;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class SecurityConfigurationValidator {

    public SecurityConfigurationValidator(
            SecurityProperties securityProperties, Environment environment) {
        validateJwtSecret(securityProperties, environment);
    }

    private void validateJwtSecret(SecurityProperties securityProperties, Environment environment) {
        String jwtSecret = securityProperties.getJwt().getSecret();
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "app.security.jwt.secret must be configured for the active profile.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "app.security.jwt.secret must contain at least 32 bytes for HS256 signing.");
        }
        String normalized = jwtSecret.toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("development")
                || normalized.contains("change-before")
                || normalized.contains("dev-jwt")) {
            throw new IllegalStateException(
                    "Development and placeholder JWT secrets are forbidden in every profile.");
        }
    }
}
