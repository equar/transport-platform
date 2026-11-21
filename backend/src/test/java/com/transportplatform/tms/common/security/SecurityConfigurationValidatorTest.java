package com.transportplatform.tms.common.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class SecurityConfigurationValidatorTest {

    private static final String STRONG_JWT_SECRET = "this-is-a-production-jwt-secret-with-more-than-thirty-two-bytes";

    @Test
    void acceptsStrongJwtSecretInProd() {
        assertDoesNotThrow(() -> new SecurityConfigurationValidator(securityProperties(STRONG_JWT_SECRET),
                prodEnvironment()));
    }

    @Test
    void rejectsMissingJwtSecret() {
        assertThrows(IllegalStateException.class,
                () -> new SecurityConfigurationValidator(securityProperties(null), prodEnvironment()));
    }

    @Test
    void rejectsDevelopmentJwtSecretInProd() {
        assertThrows(IllegalStateException.class,
                () -> new SecurityConfigurationValidator(
                        securityProperties("development-placeholder-".repeat(3)), prodEnvironment()));
    }

    @Test
    void rejectsPlaceholderSecretsInDevelopmentAndDisabledProductionMfa() {
        assertThrows(IllegalStateException.class,()->new SecurityConfigurationValidator(
            securityProperties("development-placeholder-".repeat(3)),new MockEnvironment().withProperty("spring.profiles.active","dev")));
        assertThrows(IllegalStateException.class,()->new SecurityConfigurationValidator(
            securityProperties(STRONG_JWT_SECRET),prodEnvironment().withProperty("app.auth.require-mfa-for-privileged-accounts","false")));
    }

    private SecurityProperties securityProperties() {
        return securityProperties(STRONG_JWT_SECRET);
    }

    private SecurityProperties securityProperties(String jwtSecret) {
        SecurityProperties properties = new SecurityProperties();
        properties.getJwt().setSecret(jwtSecret);
        return properties;
    }

    private MockEnvironment prodEnvironment() {
        return new MockEnvironment().withProperty("spring.profiles.active", "prod");
    }
}