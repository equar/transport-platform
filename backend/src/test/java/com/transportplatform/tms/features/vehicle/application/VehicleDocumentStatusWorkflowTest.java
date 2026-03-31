package com.transportplatform.tms.features.vehicle.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class VehicleDocumentStatusWorkflowTest {

    @Test
    void expiredDocumentResolvesToExpiredStatus() {
        VehicleDocument document = new VehicleDocument();
        document.setStatus(VehicleDocumentStatus.ACTIVE);
        document.setVerificationStatus(VehicleDocumentVerificationStatus.VERIFIED);
        document.setExpiryDate(LocalDate.of(2026, 3, 1));

        VehicleDocumentVerificationStatus status = VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(
                document,
                LocalDate.of(2026, 3, 31));

        assertEquals(VehicleDocumentVerificationStatus.EXPIRED, status);
    }

    @Test
    void verifyRejectsExpiredDocument() {
        VehicleDocument document = new VehicleDocument();
        document.setStatus(VehicleDocumentStatus.ACTIVE);
        document.setVerificationStatus(VehicleDocumentVerificationStatus.PENDING);
        document.setExpiryDate(LocalDate.of(2026, 3, 1));

        ApiException exception = assertThrows(ApiException.class,
                () -> VehicleDocumentStatusWorkflow.ensureCanVerify(document, LocalDate.of(2026, 3, 31)));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }
}