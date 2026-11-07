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
                        securityProperties("dev-jwt-secret-change-before-deployment-1234567890"), prodEnvironment()));
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