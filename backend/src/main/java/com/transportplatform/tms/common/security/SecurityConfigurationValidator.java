package com.transportplatform.tms.common.security;

import java.nio.charset.StandardCharsets;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

@Component
public class SecurityConfigurationValidator {

    private static final String LOCAL_DEVELOPMENT_SECRET = "local-development-jwt-secret-change-before-shared-use-1234567890";
    private static final String DEV_SECRET = "dev-jwt-secret-change-before-deployment-1234567890";
    public SecurityConfigurationValidator(SecurityProperties securityProperties, Environment environment) {
        validateJwtSecret(securityProperties, environment);
    }

    private void validateJwtSecret(SecurityProperties securityProperties, Environment environment) {
        String jwtSecret = securityProperties.getJwt().getSecret();
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("app.security.jwt.secret must be configured for the active profile.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "app.security.jwt.secret must contain at least 32 bytes for HS256 signing.");
        }
        if (environment.acceptsProfiles(Profiles.of("prod"))
                && (LOCAL_DEVELOPMENT_SECRET.equals(jwtSecret) || DEV_SECRET.equals(jwtSecret))) {
            throw new IllegalStateException("A development JWT secret cannot be used in the prod profile.");
        }
    }

}
