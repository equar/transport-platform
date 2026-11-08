package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

/** Validate before storing the file or accepting a verification decision. */
public final class DriverDocumentMetadata {
    private DriverDocumentMetadata() {}

    public static void requireComplete(String number, String authority, LocalDate issued, LocalDate expires) {
        if (number == null || number.isBlank() || authority == null || authority.isBlank()
                || issued == null || expires == null) {
            throw invalid("Document number, issuing authority, issue date, and expiry date are required.");
        }
        if (number.trim().length() > 120 || authority.trim().length() > 150) {
            throw invalid("Document number must be at most 120 characters and issuing authority at most 150 characters.");
        }
        if (expires.isBefore(issued)) throw invalid("Document expiry date cannot be earlier than the issue date.");
    }

    private static ApiException invalid(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}
