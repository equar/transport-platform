package com.transportplatform.tms.features.driver.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class DriverDocumentStatusWorkflowTest {

    @Test
    void expiredDocumentResolvesToExpiredStatus() {
        DriverDocument document = new DriverDocument();
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setVerificationStatus(DriverDocumentVerificationStatus.VERIFIED);
        document.setExpiryDate(LocalDate.of(2026, 3, 1));

        DriverDocumentVerificationStatus status = DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(
                document,
                LocalDate.of(2026, 3, 31));

        assertEquals(DriverDocumentVerificationStatus.EXPIRED, status);
    }

    @Test
    void verifyRejectsExpiredDocument() {
        DriverDocument document = new DriverDocument();
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setVerificationStatus(DriverDocumentVerificationStatus.PENDING);
        document.setExpiryDate(LocalDate.of(2026, 3, 1));

        ApiException exception = assertThrows(ApiException.class,
                () -> DriverDocumentStatusWorkflow.ensureCanVerify(document, LocalDate.of(2026, 3, 31)));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }
}