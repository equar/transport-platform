package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentReviewRequest;
import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleDocumentResponse;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleDocumentService {

    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final VehicleAccessService vehicleAccessService;
    private final VehicleDocumentMapper vehicleDocumentMapper;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final Clock clock;

    public VehicleDocumentService(VehicleDocumentRepository vehicleDocumentRepository,
            VehicleAccessService vehicleAccessService,
            VehicleDocumentMapper vehicleDocumentMapper,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            Clock clock) {
        this.vehicleDocumentRepository = vehicleDocumentRepository;
        this.vehicleAccessService = vehicleAccessService;
        this.vehicleDocumentMapper = vehicleDocumentMapper;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<VehicleDocumentResponse> searchCompanyVehicleDocuments(Long vehicleId,
            VehicleDocumentType documentType,
            VehicleDocumentVerificationStatus verificationStatus,
            VehicleDocumentStatus status,
            int page,
            int size) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        var result = vehicleDocumentRepository.findAll(
                VehicleDocumentSpecifications.search(vehicle.getTenantId(), vehicle.getId(), documentType,
                        verificationStatus, status),
                pageable);
        return PageResponse.from(result.map(vehicleDocumentMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public VehicleDocumentResponse getCompanyVehicleDocument(Long documentId) {
        return vehicleDocumentMapper.toResponse(findDocument(documentId));
    }

    @Transactional
    public VehicleDocumentResponse createCompanyVehicleDocument(Long vehicleId, VehicleDocumentUpsertRequest request) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        validateRequest(request);
        VehicleDocument document = new VehicleDocument();
        vehicleDocumentMapper.apply(document, request);
        document.setVehicle(vehicle);
        document.setTenantId(vehicle.getTenantId());
        document.setStatus(VehicleDocumentStatus.ACTIVE);
        document.setVerificationStatus(resolveStoredVerificationStatus(request.expiryDate()));
        document.setUploadedBy(currentAuthenticatedUserService.requireCurrentUser().username());
        document.setUploadedAt(Instant.now(clock));
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "CREATED", "Vehicle document " + saved.getDocumentType().name() + " was created.", null,
                snapshot(saved));
        return vehicleDocumentMapper.toResponse(saved);
    }

    @Transactional
    public VehicleDocumentResponse updateCompanyVehicleDocument(Long documentId, VehicleDocumentUpsertRequest request) {
        VehicleDocument document = findDocument(documentId);
        validateRequest(request);
        Object oldSnapshot = snapshot(document);
        vehicleDocumentMapper.apply(document, request);
        document.setVerificationStatus(resolveStoredVerificationStatus(request.expiryDate()));
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "UPDATED", "Vehicle document " + saved.getDocumentType().name() + " was updated.",
                oldSnapshot, snapshot(saved));
        return vehicleDocumentMapper.toResponse(saved);
    }

    @Transactional
    public VehicleDocumentResponse verifyCompanyVehicleDocument(Long documentId, VehicleDocumentReviewRequest request) {
        VehicleDocument document = findDocument(documentId);
        VehicleDocumentStatusWorkflow.ensureCanVerify(document, LocalDate.now(clock));
        Object oldSnapshot = snapshot(document);
        document.setVerificationStatus(VehicleDocumentVerificationStatus.VERIFIED);
        if (request.notes() != null && !request.notes().isBlank()) {
            document.setNotes(request.notes().trim());
        }
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "VERIFIED", "Vehicle document " + saved.getDocumentType().name() + " was verified.",
                oldSnapshot, snapshot(saved));
        notificationEventService.publishVehicleDocumentVerified(saved);
        return vehicleDocumentMapper.toResponse(saved);
    }

    @Transactional
    public VehicleDocumentResponse rejectCompanyVehicleDocument(Long documentId, VehicleDocumentReviewRequest request) {
        VehicleDocument document = findDocument(documentId);
        VehicleDocumentStatusWorkflow.ensureCanReject(document);
        if (request.notes() == null || request.notes().isBlank()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Notes are required when rejecting a vehicle document.");
        }
        Object oldSnapshot = snapshot(document);
        document.setVerificationStatus(VehicleDocumentVerificationStatus.REJECTED);
        document.setNotes(request.notes().trim());
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "REJECTED", "Vehicle document " + saved.getDocumentType().name() + " was rejected.",
                oldSnapshot, snapshot(saved));
        notificationEventService.publishVehicleDocumentRejected(saved);
        return vehicleDocumentMapper.toResponse(saved);
    }

    @Transactional
    public VehicleDocumentResponse activateCompanyVehicleDocument(Long documentId) {
        VehicleDocument document = findDocument(documentId);
        VehicleDocumentStatusWorkflow.ensureCanActivate(document);
        Object oldSnapshot = snapshot(document);
        document.setStatus(VehicleDocumentStatus.ACTIVE);
        if (document.getExpiryDate() != null && document.getExpiryDate().isBefore(LocalDate.now(clock))) {
            document.setVerificationStatus(VehicleDocumentVerificationStatus.EXPIRED);
        }
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "ACTIVATED", "Vehicle document " + saved.getDocumentType().name() + " was activated.",
                oldSnapshot, snapshot(saved));
        return vehicleDocumentMapper.toResponse(saved);
    }

    @Transactional
    public VehicleDocumentResponse archiveCompanyVehicleDocument(Long documentId) {
        VehicleDocument document = findDocument(documentId);
        VehicleDocumentStatusWorkflow.ensureCanArchive(document);
        Object oldSnapshot = snapshot(document);
        document.setStatus(VehicleDocumentStatus.ARCHIVED);
        VehicleDocument saved = vehicleDocumentRepository.save(document);
        recordAudit(saved, "ARCHIVED", "Vehicle document " + saved.getDocumentType().name() + " was archived.",
                oldSnapshot, snapshot(saved));
        return vehicleDocumentMapper.toResponse(saved);
    }

    private VehicleDocument findDocument(Long documentId) {
        String tenantId = vehicleAccessService.requireCompanyTenantId();
        return vehicleDocumentRepository.findByIdAndTenantId(documentId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Vehicle document was not found."));
    }

    private void validateRequest(VehicleDocumentUpsertRequest request) {
        if (request.issueDate() != null && request.expiryDate() != null
                && request.expiryDate().isBefore(request.issueDate())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Document expiry date cannot be earlier than the issue date.");
        }
    }

    private VehicleDocumentVerificationStatus resolveStoredVerificationStatus(LocalDate expiryDate) {
        if (expiryDate != null && expiryDate.isBefore(LocalDate.now(clock))) {
            return VehicleDocumentVerificationStatus.EXPIRED;
        }
        return VehicleDocumentVerificationStatus.PENDING;
    }

    private void recordAudit(VehicleDocument document, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                document.getTenantId(),
                "VEHICLE_DOCUMENT",
                action,
                "VEHICLE_DOCUMENT",
                resolveEntityId(document),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(VehicleDocument document) {
        if (document.getId() != null) {
            return document.getId().toString();
        }
        return document.getFileName();
    }

    private Object snapshot(VehicleDocument document) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", document.getId());
        values.put("vehicleId", document.getVehicle().getId());
        values.put("tenantId", document.getTenantId());
        values.put("documentType", document.getDocumentType() == null ? null : document.getDocumentType().name());
        values.put("status", document.getStatus() == null ? null : document.getStatus().name());
        values.put("verificationStatus",
                document.getVerificationStatus() == null ? null : document.getVerificationStatus().name());
        values.put("fileName", document.getFileName());
        values.put("documentNumber", document.getDocumentNumber());
        values.put("expiryDate", document.getExpiryDate());
        return values;
    }
}