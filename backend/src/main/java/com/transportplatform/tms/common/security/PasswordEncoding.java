package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Enforces the existing bcrypt byte limit without truncating passwords or changing stored hashes. */
public final class PasswordEncoding {
    private PasswordEncoding() {}
    public static String encode(PasswordEncoder encoder, String password) {
        if (password == null || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "This password is too long. Try a shorter one.");
        }
        return encoder.encode(password);
    }
    public static boolean matches(PasswordEncoder encoder, String password, String encoded) {
        if (password == null || password.getBytes(StandardCharsets.UTF_8).length > 72) return false;
        try { return encoder.matches(password, encoded); }
        catch (IllegalArgumentException error) { return false; }
    }
}
