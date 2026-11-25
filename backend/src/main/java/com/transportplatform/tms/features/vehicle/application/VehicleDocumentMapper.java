package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleDocumentResponse;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class VehicleDocumentMapper {

    @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.features.settings.application.TenantTimeService tenantTime;
    private final Clock clock;

    public VehicleDocumentMapper(Clock clock) {
        this.clock = clock;
    }

    public void apply(VehicleDocument document, VehicleDocumentUpsertRequest request) {
        document.setDocumentType(request.documentType());
        // Attachment identity is assigned exclusively by the upload workflow.
        document.setDocumentNumber(trimToNull(request.documentNumber()));
        document.setIssuingAuthority(trimToNull(request.issuingAuthority()));
        document.setIssueDate(request.issueDate());
        document.setExpiryDate(request.expiryDate());
        document.setNotes(trimToNull(request.notes()));
    }

    public VehicleDocumentResponse toResponse(VehicleDocument document) {
        return new VehicleDocumentResponse(
                document.getId(),
                document.getVehicle().getId(),
                document.getDocumentType(),
                document.getFileName(),
                document.getOriginalFileName(),
                document.getContentType(),
                document.getStoragePath(),
                document.getDocumentNumber(),
                document.getIssuingAuthority(),
                document.getIssueDate(),
                document.getExpiryDate(),
                VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document, tenantTime.today(document.getTenantId())),
                document.getStatus(),
                document.getNotes(),
                document.getUploadedBy(),
                document.getUploadedAt(),
                document.getCreatedBy(),
                document.getCreatedAt(),
                document.getUpdatedBy(),
                document.getUpdatedAt(), document.getVersion());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}