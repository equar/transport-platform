package com.transportplatform.tms.features.driver.api.response;

import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import java.time.Instant;
import java.time.LocalDate;

public record DriverDocumentResponse(
        Long id,
        Long driverId,
        DriverDocumentType documentType,
        String fileName,
        String originalFileName,
        String contentType,
        String storagePath,
        String documentNumber,
        String issuingAuthority,
        LocalDate issueDate,
        LocalDate expiryDate,
        DriverDocumentVerificationStatus verificationStatus,
        DriverDocumentStatus status,
        String notes,
        String uploadedBy,
        Instant uploadedAt,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}