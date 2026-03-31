package com.transportplatform.tms.features.vehicle.api.response;

import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import java.time.Instant;
import java.time.LocalDate;

public record VehicleDocumentResponse(
        Long id,
        Long vehicleId,
        VehicleDocumentType documentType,
        String fileName,
        String originalFileName,
        String contentType,
        String storagePath,
        String documentNumber,
        String issuingAuthority,
        LocalDate issueDate,
        LocalDate expiryDate,
        VehicleDocumentVerificationStatus verificationStatus,
        VehicleDocumentStatus status,
        String notes,
        String uploadedBy,
        Instant uploadedAt,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}