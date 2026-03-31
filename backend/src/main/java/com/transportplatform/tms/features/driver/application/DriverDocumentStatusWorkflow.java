package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

public final class DriverDocumentStatusWorkflow {

    private DriverDocumentStatusWorkflow() {
    }

    public static void ensureCanVerify(DriverDocument document, LocalDate today) {
        if (document.getStatus() != DriverDocumentStatus.ACTIVE) {
            throw invalidTransition("Only active documents can be verified.");
        }
        if (resolveEffectiveVerificationStatus(document, today) == DriverDocumentVerificationStatus.EXPIRED) {
            throw invalidTransition("Expired documents cannot be verified.");
        }
    }

    public static void ensureCanReject(DriverDocument document) {
        if (document.getStatus() != DriverDocumentStatus.ACTIVE) {
            throw invalidTransition("Only active documents can be rejected.");
        }
        if (document.getVerificationStatus() == DriverDocumentVerificationStatus.REJECTED) {
            throw invalidTransition("Document is already rejected.");
        }
    }

    public static void ensureCanArchive(DriverDocument document) {
        if (document.getStatus() == DriverDocumentStatus.ARCHIVED) {
            throw invalidTransition("Document is already archived.");
        }
    }

    public static void ensureCanActivate(DriverDocument document) {
        if (document.getStatus() == DriverDocumentStatus.ACTIVE) {
            throw invalidTransition("Document is already active.");
        }
        if (document.getStatus() == DriverDocumentStatus.ARCHIVED) {
            throw invalidTransition("Archived documents cannot be reactivated.");
        }
    }

    public static DriverDocumentVerificationStatus resolveEffectiveVerificationStatus(DriverDocument document,
            LocalDate today) {
        if (document.getStatus() == DriverDocumentStatus.ACTIVE
                && document.getExpiryDate() != null
                && document.getExpiryDate().isBefore(today)) {
            return DriverDocumentVerificationStatus.EXPIRED;
        }
        return document.getVerificationStatus();
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}