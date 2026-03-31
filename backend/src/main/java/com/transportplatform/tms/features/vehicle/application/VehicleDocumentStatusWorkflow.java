package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

public final class VehicleDocumentStatusWorkflow {

    private VehicleDocumentStatusWorkflow() {
    }

    public static void ensureCanVerify(VehicleDocument document, LocalDate today) {
        if (document.getStatus() != VehicleDocumentStatus.ACTIVE) {
            throw invalidTransition("Only active documents can be verified.");
        }
        if (resolveEffectiveVerificationStatus(document, today) == VehicleDocumentVerificationStatus.EXPIRED) {
            throw invalidTransition("Expired documents cannot be verified.");
        }
    }

    public static void ensureCanReject(VehicleDocument document) {
        if (document.getStatus() != VehicleDocumentStatus.ACTIVE) {
            throw invalidTransition("Only active documents can be rejected.");
        }
        if (document.getVerificationStatus() == VehicleDocumentVerificationStatus.REJECTED) {
            throw invalidTransition("Document is already rejected.");
        }
    }

    public static void ensureCanArchive(VehicleDocument document) {
        if (document.getStatus() == VehicleDocumentStatus.ARCHIVED) {
            throw invalidTransition("Document is already archived.");
        }
    }

    public static void ensureCanActivate(VehicleDocument document) {
        if (document.getStatus() == VehicleDocumentStatus.ACTIVE) {
            throw invalidTransition("Document is already active.");
        }
        if (document.getStatus() == VehicleDocumentStatus.ARCHIVED) {
            throw invalidTransition("Archived documents cannot be reactivated.");
        }
    }

    public static VehicleDocumentVerificationStatus resolveEffectiveVerificationStatus(VehicleDocument document,
            LocalDate today) {
        if (document.getStatus() == VehicleDocumentStatus.ACTIVE
                && document.getExpiryDate() != null
                && document.getExpiryDate().isBefore(today)) {
            return VehicleDocumentVerificationStatus.EXPIRED;
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