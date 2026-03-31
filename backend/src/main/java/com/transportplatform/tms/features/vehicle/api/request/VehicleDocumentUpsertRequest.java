package com.transportplatform.tms.features.vehicle.api.request;

import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record VehicleDocumentUpsertRequest(
        @NotNull(message = "Document type is required.") VehicleDocumentType documentType,
        @NotBlank(message = "File name is required.") @Size(max = 255, message = "File name must be 255 characters or fewer.") String fileName,
        @Size(max = 255, message = "Original file name must be 255 characters or fewer.") String originalFileName,
        @Size(max = 120, message = "Content type must be 120 characters or fewer.") String contentType,
        @Size(max = 500, message = "Storage path must be 500 characters or fewer.") String storagePath,
        @Size(max = 120, message = "Document number must be 120 characters or fewer.") String documentNumber,
        @Size(max = 150, message = "Issuing authority must be 150 characters or fewer.") String issuingAuthority,
        LocalDate issueDate,
        LocalDate expiryDate,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}