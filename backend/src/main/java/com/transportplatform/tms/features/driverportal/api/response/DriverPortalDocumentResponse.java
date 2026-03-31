package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import java.time.LocalDate;

public record DriverPortalDocumentResponse(
        Long id,
        DriverDocumentType documentType,
        String fileName,
        LocalDate issueDate,
        LocalDate expiryDate,
        DriverDocumentVerificationStatus verificationStatus,
        DriverDocumentStatus status,
        String notes) {
}