package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.api.request.DriverDocumentReviewRequest;
import com.transportplatform.tms.features.driver.api.request.DriverDocumentUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverDocumentResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DriverDocumentService {

    private final DriverDocumentRepository driverDocumentRepository;
    private final DriverAccessService driverAccessService;
    private final DriverDocumentMapper driverDocumentMapper;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final DriverDocumentStorageService driverDocumentStorageService;
    private final ComplianceIssueSyncService complianceIssueSyncService;
    private final Clock clock;

    public DriverDocumentService(DriverDocumentRepository driverDocumentRepository,
            DriverAccessService driverAccessService,
            DriverDocumentMapper driverDocumentMapper,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            DriverDocumentStorageService driverDocumentStorageService,
            ComplianceIssueSyncService complianceIssueSyncService,
            Clock clock) {
        this.driverDocumentRepository = driverDocumentRepository;
        this.driverAccessService = driverAccessService;
        this.driverDocumentMapper = driverDocumentMapper;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.driverDocumentStorageService = driverDocumentStorageService;
        this.complianceIssueSyncService = complianceIssueSyncService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public StoredDriverDocumentFile loadCompanyDriverDocumentFile(Long documentId) {
        DriverDocument document = findDocument(documentId);
        return driverDocumentStorageService.load(document.getStoragePath(),
                document.getOriginalFileName() == null ? document.getFileName() : document.getOriginalFileName(),
                document.getContentType());
    }

    @Transactional(readOnly = true)
    public PageResponse<DriverDocumentResponse> searchCompanyDriverDocuments(Long driverId,
            DriverDocumentType documentType,
            DriverDocumentVerificationStatus verificationStatus,
            DriverDocumentStatus status,
            int page,
            int size) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        var result = driverDocumentRepository.findAll(
                DriverDocumentSpecifications.search(driver.getTenantId(), driver.getId(), documentType,
                        verificationStatus, status),
                pageable);
        return PageResponse.from(result.map(driverDocumentMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public List<DriverDocumentResponse> listCompanyDriverDocuments(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        return driverDocumentRepository
                .findAllByTenantIdAndDriver_IdIn(driver.getTenantId(), List.of(driver.getId()))
                .stream()
                .sorted(Comparator.comparing(DriverDocument::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(driverDocumentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DriverDocumentResponse getCompanyDriverDocument(Long documentId) {
        return driverDocumentMapper.toResponse(findDocument(documentId));
    }

    @Transactional
    public DriverDocumentResponse createCompanyDriverDocument(Long driverId, DriverDocumentUpsertRequest request) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        validateRequest(request);
        DriverDocument document = new DriverDocument();
        driverDocumentMapper.apply(document, request);
        document.setDriver(driver);
        document.setTenantId(driver.getTenantId());
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setVerificationStatus(resolveStoredVerificationStatus(request.expiryDate()));
        document.setUploadedBy(currentAuthenticatedUserService.requireCurrentUser().username());
        document.setUploadedAt(Instant.now(clock));
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "CREATED", "Driver document " + saved.getDocumentType().name() + " was created.", null,
                snapshot(saved));
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse uploadCompanyDriverDocument(Long driverId,
            DriverDocumentType documentType,
            String documentNumber,
            String issuingAuthority,
            LocalDate issueDate,
            LocalDate expiryDate,
            String notes,
            MultipartFile file) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        if (issueDate != null && expiryDate != null && expiryDate.isBefore(issueDate)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Document expiry date cannot be earlier than the issue date.");
        }
        String storagePath = driverDocumentStorageService.store(driver.getTenantId(), driver.getId(), file);
        String originalFileName = resolveOriginalFileName(file);
        DriverDocument document = new DriverDocument();
        document.setTenantId(driver.getTenantId());
        document.setDriver(driver);
        document.setDocumentType(documentType);
        document.setFileName(java.nio.file.Path.of(storagePath).getFileName().toString());
        document.setOriginalFileName(originalFileName);
        document.setContentType(file.getContentType());
        document.setStoragePath(storagePath);
        document.setDocumentNumber(trimToNull(documentNumber));
        document.setIssuingAuthority(trimToNull(issuingAuthority));
        document.setIssueDate(issueDate);
        document.setExpiryDate(expiryDate);
        document.setNotes(trimToNull(notes));
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setVerificationStatus(resolveStoredVerificationStatus(expiryDate));
        document.setUploadedBy(currentAuthenticatedUserService.requireCurrentUser().username());
        document.setUploadedAt(Instant.now(clock));
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "UPLOADED", "Driver document " + saved.getDocumentType().name()
                + " was uploaded for review.", null, snapshot(saved));
        complianceIssueSyncService.synchronizeTenantIssues(saved.getTenantId());
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse updateCompanyDriverDocument(Long documentId, DriverDocumentUpsertRequest request) {
        DriverDocument document = findDocument(documentId);
        validateRequest(request);
        Object oldSnapshot = snapshot(document);
        driverDocumentMapper.apply(document, request);
        document.setVerificationStatus(resolveStoredVerificationStatus(request.expiryDate()));
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "UPDATED", "Driver document " + saved.getDocumentType().name() + " was updated.",
                oldSnapshot, snapshot(saved));
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse verifyCompanyDriverDocument(Long documentId, DriverDocumentReviewRequest request) {
        DriverDocument document = findDocument(documentId);
        DriverDocumentStatusWorkflow.ensureCanVerify(document, LocalDate.now(clock));
        Object oldSnapshot = snapshot(document);
        document.setVerificationStatus(DriverDocumentVerificationStatus.VERIFIED);
        if (request.notes() != null && !request.notes().isBlank()) {
            document.setNotes(request.notes().trim());
        }
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "VERIFIED", "Driver document " + saved.getDocumentType().name() + " was verified.",
                oldSnapshot, snapshot(saved));
        notificationEventService.publishDriverDocumentVerified(saved);
        complianceIssueSyncService.synchronizeTenantIssues(saved.getTenantId());
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse rejectCompanyDriverDocument(Long documentId, DriverDocumentReviewRequest request) {
        DriverDocument document = findDocument(documentId);
        DriverDocumentStatusWorkflow.ensureCanReject(document);
        if (request.notes() == null || request.notes().isBlank()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Notes are required when rejecting a driver document.");
        }
        Object oldSnapshot = snapshot(document);
        document.setVerificationStatus(DriverDocumentVerificationStatus.REJECTED);
        document.setNotes(request.notes().trim());
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "REJECTED", "Driver document " + saved.getDocumentType().name() + " was rejected.",
                oldSnapshot, snapshot(saved));
        notificationEventService.publishDriverDocumentRejected(saved);
        complianceIssueSyncService.synchronizeTenantIssues(saved.getTenantId());
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse activateCompanyDriverDocument(Long documentId) {
        DriverDocument document = findDocument(documentId);
        DriverDocumentStatusWorkflow.ensureCanActivate(document);
        Object oldSnapshot = snapshot(document);
        document.setStatus(DriverDocumentStatus.ACTIVE);
        if (document.getExpiryDate() != null && document.getExpiryDate().isBefore(LocalDate.now(clock))) {
            document.setVerificationStatus(DriverDocumentVerificationStatus.EXPIRED);
        }
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "ACTIVATED", "Driver document " + saved.getDocumentType().name() + " was activated.",
                oldSnapshot, snapshot(saved));
        return driverDocumentMapper.toResponse(saved);
    }

    @Transactional
    public DriverDocumentResponse archiveCompanyDriverDocument(Long documentId) {
        DriverDocument document = findDocument(documentId);
        DriverDocumentStatusWorkflow.ensureCanArchive(document);
        Object oldSnapshot = snapshot(document);
        document.setStatus(DriverDocumentStatus.ARCHIVED);
        DriverDocument saved = driverDocumentRepository.save(document);
        recordAudit(saved, "ARCHIVED", "Driver document " + saved.getDocumentType().name() + " was archived.",
                oldSnapshot, snapshot(saved));
        return driverDocumentMapper.toResponse(saved);
    }

    private DriverDocument findDocument(Long documentId) {
        String tenantId = driverAccessService.requireCompanyTenantId();
        return driverDocumentRepository.findByIdAndTenantId(documentId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Driver document was not found."));
    }

    private void validateRequest(DriverDocumentUpsertRequest request) {
        if (request.issueDate() != null && request.expiryDate() != null
                && request.expiryDate().isBefore(request.issueDate())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Document expiry date cannot be earlier than the issue date.");
        }
    }

    private DriverDocumentVerificationStatus resolveStoredVerificationStatus(LocalDate expiryDate) {
        if (expiryDate != null && expiryDate.isBefore(LocalDate.now(clock))) {
            return DriverDocumentVerificationStatus.EXPIRED;
        }
        return DriverDocumentVerificationStatus.PENDING;
    }

    private String resolveOriginalFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename() == null ? "document" :
                java.nio.file.Path.of(file.getOriginalFilename()).getFileName().toString().trim();
        return originalFileName.isEmpty() ? "document" : originalFileName.substring(0, Math.min(originalFileName.length(), 255));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void recordAudit(DriverDocument document, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                document.getTenantId(),
                "DRIVER_DOCUMENT",
                action,
                "DRIVER_DOCUMENT",
                resolveEntityId(document),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(DriverDocument document) {
        if (document.getId() != null) {
            return document.getId().toString();
        }
        return document.getFileName();
    }

    private Object snapshot(DriverDocument document) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", document.getId());
        values.put("driverId", document.getDriver().getId());
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
