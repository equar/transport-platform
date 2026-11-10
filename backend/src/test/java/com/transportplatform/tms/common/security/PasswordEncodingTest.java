package com.transportplatform.tms.common.security;
import static org.junit.jupiter.api.Assertions.*;
import com.transportplatform.tms.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
class PasswordEncodingTest {
    final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    @Test void preservesNormalAndLegacyBcryptAuthentication() {
        String hash = PasswordEncoding.encode(encoder, "valid-password");
        assertTrue(PasswordEncoding.matches(encoder, "valid-password", hash));
        assertTrue(PasswordEncoding.matches(encoder, "legacy-password", encoder.encode("legacy-password")));
    }
    @Test void rejectsOverlongAsciiAndUtf8PasswordsAsValidationErrors() {
        assertThrows(ApiException.class, () -> PasswordEncoding.encode(encoder, "a".repeat(100)));
        assertThrows(ApiException.class, () -> PasswordEncoding.encode(encoder, "é".repeat(37)));
        assertFalse(PasswordEncoding.matches(encoder, "a".repeat(100), encoder.encode("normal-password")));
    }
    @Test void acceptsTheExactMultibyteBoundaryWithoutTruncation() {
        String password = "é".repeat(36);
        assertTrue(PasswordEncoding.matches(encoder, password, PasswordEncoding.encode(encoder, password)));
    }
}
