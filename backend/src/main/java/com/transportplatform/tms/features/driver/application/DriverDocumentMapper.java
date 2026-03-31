package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.features.driver.api.request.DriverDocumentUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverDocumentResponse;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class DriverDocumentMapper {

    private final Clock clock;

    public DriverDocumentMapper(Clock clock) {
        this.clock = clock;
    }

    public void apply(DriverDocument document, DriverDocumentUpsertRequest request) {
        document.setDocumentType(request.documentType());
        document.setFileName(request.fileName().trim());
        document.setOriginalFileName(trimToNull(request.originalFileName()));
        document.setContentType(trimToNull(request.contentType()));
        document.setStoragePath(trimToNull(request.storagePath()));
        document.setDocumentNumber(trimToNull(request.documentNumber()));
        document.setIssuingAuthority(trimToNull(request.issuingAuthority()));
        document.setIssueDate(request.issueDate());
        document.setExpiryDate(request.expiryDate());
        document.setNotes(trimToNull(request.notes()));
    }

    public DriverDocumentResponse toResponse(DriverDocument document) {
        return new DriverDocumentResponse(
                document.getId(),
                document.getDriver().getId(),
                document.getDocumentType(),
                document.getFileName(),
                document.getOriginalFileName(),
                document.getContentType(),
                document.getStoragePath(),
                document.getDocumentNumber(),
                document.getIssuingAuthority(),
                document.getIssueDate(),
                document.getExpiryDate(),
                DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document, LocalDate.now(clock)),
                document.getStatus(),
                document.getNotes(),
                document.getUploadedBy(),
                document.getUploadedAt(),
                document.getCreatedBy(),
                document.getCreatedAt(),
                document.getUpdatedBy(),
                document.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}