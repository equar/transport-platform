package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.application.DriverDocumentStatusWorkflow;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.application.VehicleDocumentStatusWorkflow;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ComplianceIssueSyncService {
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate db;

    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.settings.application.TenantTimeService tenantTime;

    private static final int EXPIRING_SOON_WINDOW_DAYS = 30;
    private static final Set<ComplianceIssueStatus> ACTIVE_STATUSES =
            Set.of(ComplianceIssueStatus.OPEN, ComplianceIssueStatus.ACKNOWLEDGED);

    private final ComplianceIssueRepository complianceIssueRepository;
    private final DriverRepository driverRepository;
    private final DriverDocumentRepository driverDocumentRepository;
    private final DriverComplianceSummaryService driverComplianceSummaryService;
    private final VehicleRepository vehicleRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final VehicleComplianceSummaryService vehicleComplianceSummaryService;
    private final NotificationEventService notificationEventService;
    private final Clock clock;

    public ComplianceIssueSyncService(
            ComplianceIssueRepository complianceIssueRepository,
            DriverRepository driverRepository,
            DriverDocumentRepository driverDocumentRepository,
            DriverComplianceSummaryService driverComplianceSummaryService,
            VehicleRepository vehicleRepository,
            VehicleDocumentRepository vehicleDocumentRepository,
            VehicleComplianceSummaryService vehicleComplianceSummaryService,
            NotificationEventService notificationEventService,
            Clock clock) {
        this.complianceIssueRepository = complianceIssueRepository;
        this.driverRepository = driverRepository;
        this.driverDocumentRepository = driverDocumentRepository;
        this.driverComplianceSummaryService = driverComplianceSummaryService;
        this.vehicleRepository = vehicleRepository;
        this.vehicleDocumentRepository = vehicleDocumentRepository;
        this.vehicleComplianceSummaryService = vehicleComplianceSummaryService;
        this.notificationEventService = notificationEventService;
        this.clock = clock;
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.common.concurrency.WorkflowLockService locks;

    /** Read-side snapshots are maintained by entity mutations and the paged worker. */
    @Transactional(readOnly = true)
    public List<ComplianceIssue> listTenantIssueSnapshot(String tenantId) {
        return complianceIssueRepository.findAllByTenantId(tenantId);
    }

    @Transactional
    public void synchronizeDriver(String tenantId, long id) {
        locks.lock(tenantId, "COMPLIANCE_DRIVER", id);
        var driver = driverRepository.findByIdAndTenantId(id, tenantId).orElse(null);
        if (driver == null) return;
        LocalDate today = tenantTime.today(tenantId);
        var documents = driverDocumentRepository.findAllByTenantIdAndDriver_IdIn(tenantId, List.of(id));
        reconcile(tenantId, ComplianceEntityType.DRIVER, id, deriveDriverCandidates(driver, documents, today, today.plusDays(30)));
    }

    @Transactional
    public void synchronizeVehicle(String tenantId, long id) {
        locks.lock(tenantId, "COMPLIANCE_VEHICLE", id);
        var vehicle = vehicleRepository.findByIdAndTenantId(id, tenantId).orElse(null);
        if (vehicle == null) return;
        LocalDate today = tenantTime.today(tenantId);
        var documents = vehicleDocumentRepository.findAllByTenantIdAndVehicle_IdIn(tenantId, List.of(id));
        reconcile(tenantId, ComplianceEntityType.VEHICLE, id, deriveVehicleCandidates(vehicle, documents, today, today.plusDays(30)));
    }

    private void reconcile(String tenant, ComplianceEntityType type, long id, List<ComplianceIssueCandidate> candidates) {
        Set<String> active = new java.util.HashSet<>();
        for (var candidate : candidates) { active.add(candidate.sourceKey()); upsertIssue(candidate); }
        for (var issue : complianceIssueRepository.findAllByTenantIdAndEntityTypeAndEntityId(tenant, type, id)) {
            if (!active.contains(issue.getSourceKey()) && ACTIVE_STATUSES.contains(issue.getIssueStatus())) {
                issue.setIssueStatus(ComplianceIssueStatus.RESOLVED);
                complianceIssueRepository.save(issue);
            }
        }
    }

    private ComplianceIssue upsertIssue(ComplianceIssueCandidate candidate) {
        ComplianceIssue issue =
                complianceIssueRepository
                        .findByTenantIdAndSourceKey(candidate.tenantId(), candidate.sourceKey())
                        .orElseGet(
                                () -> {
                                    ComplianceIssue created = new ComplianceIssue();
                                    created.setTenantId(candidate.tenantId());
                                    created.setSourceKey(candidate.sourceKey());
                                    created.setIssueStatus(ComplianceIssueStatus.OPEN);
                                    return created;
                                });
        ComplianceIssueStatus previousStatus = issue.getIssueStatus();
        boolean newIssue = issue.getId() == null;

        issue.setEntityType(candidate.entityType());
        issue.setEntityId(candidate.entityId());
        issue.setEntityCode(candidate.entityCode());
        issue.setEntityNameSummary(candidate.entityNameSummary());
        issue.setIssueType(candidate.issueType());
        issue.setSeverity(candidate.severity());
        issue.setRelatedDocumentType(candidate.relatedDocumentType());
        issue.setExpiryDate(candidate.expiryDate());
        issue.setSummary(candidate.summary());
        issue.setRecommendedAction(candidate.recommendedAction());
        if (previousStatus == ComplianceIssueStatus.RESOLVED
                || previousStatus == ComplianceIssueStatus.DISMISSED) {
            issue.setIssueStatus(ComplianceIssueStatus.OPEN);
        }

        ComplianceIssue saved = complianceIssueRepository.save(issue);
        if (newIssue
                || previousStatus == ComplianceIssueStatus.RESOLVED
                || previousStatus == ComplianceIssueStatus.DISMISSED) {
            notificationEventService.publishComplianceIssueOpened(saved);
        }
        return saved;
    }

    private List<ComplianceIssueCandidate> deriveDriverCandidates(
            Driver driver,
            List<DriverDocument> documents,
            LocalDate today,
            LocalDate expiringSoonDate) {
        List<DriverDocument> activeDocuments =
                documents.stream()
                        .filter(document -> document.getStatus() == DriverDocumentStatus.ACTIVE)
                        .toList();
        Map<DriverDocumentType, List<DriverDocument>> documentsByType = new HashMap<>();
        for (DriverDocument document : activeDocuments) {
            documentsByType
                    .computeIfAbsent(document.getDocumentType(), ignored -> new ArrayList<>())
                    .add(document);
        }

        List<ComplianceIssueCandidate> candidates = new ArrayList<>();
        for (String issue :
                driverComplianceSummaryService.qualificationIssues(driver, documents, today)) {
            candidates.add(
                    buildDriverCandidate(
                            driver,
                            ComplianceIssueType.BLOCKED_FOR_ASSIGNMENT,
                            ComplianceIssueSeverity.CRITICAL,
                            issue,
                            null,
                            "Driver qualification requires review: "
                                    + issue.toLowerCase(java.util.Locale.ROOT).replace('_', ' ')
                                    + ".",
                            "Review the driver's qualification record and verified documents before"
                                + " dispatch."));
        }
        for (DriverDocumentType requiredType :
                driverComplianceSummaryService.getRequiredDocumentTypes()) {
            String documentLabel = documentLabel(requiredType);
            List<DriverDocument> typedDocuments =
                    documentsByType.getOrDefault(requiredType, List.of());
            if (typedDocuments.isEmpty()) {
                candidates.add(
                        buildDriverCandidate(
                                driver,
                                ComplianceIssueType.MISSING_REQUIRED_DOCUMENT,
                                ComplianceIssueSeverity.CRITICAL,
                                requiredType.name(),
                                null,
                                documentLabel + " is missing.",
                                "Upload and verify the "
                                        + documentLabel
                                        + " to restore compliance."));
                continue;
            }
            boolean hasVerified =
                    typedDocuments.stream()
                            .anyMatch(
                                    document ->
                                            DriverDocumentStatusWorkflow
                                                            .resolveEffectiveVerificationStatus(
                                                                    document, today)
                                                    == DriverDocumentVerificationStatus.VERIFIED);
            if (!hasVerified) {
                boolean hasPending =
                        typedDocuments.stream()
                                .anyMatch(
                                        document ->
                                                DriverDocumentStatusWorkflow
                                                                .resolveEffectiveVerificationStatus(
                                                                        document, today)
                                                        == DriverDocumentVerificationStatus
                                                                .PENDING);
                if (hasPending) {
                    DriverDocument pendingDocument = typedDocuments.get(0);
                    candidates.add(
                            buildDriverCandidate(
                                    driver,
                                    ComplianceIssueType.UNVERIFIED_DOCUMENT,
                                    ComplianceIssueSeverity.MEDIUM,
                                    requiredType.name(),
                                    pendingDocument.getExpiryDate(),
                                    documentLabel + " is awaiting verification.",
                                    "The company administrator must verify or reject the "
                                            + documentLabel
                                            + "."));
                }
            }
        }

        for (DriverDocument document : activeDocuments) {
            String documentLabel = documentLabel(document.getDocumentType());
            DriverDocumentVerificationStatus effectiveStatus =
                    DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(
                            document, today);
            if (effectiveStatus == DriverDocumentVerificationStatus.EXPIRED) {
                candidates.add(
                        buildDriverCandidate(
                                driver,
                                ComplianceIssueType.EXPIRED_DOCUMENT,
                                isRequired(
                                                driverComplianceSummaryService
                                                        .getRequiredDocumentTypes(),
                                                document.getDocumentType())
                                        ? ComplianceIssueSeverity.CRITICAL
                                        : ComplianceIssueSeverity.HIGH,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                documentLabel + " has expired.",
                                "Upload a renewed "
                                        + documentLabel
                                        + " and complete verification."));
            } else if (document.getExpiryDate() != null
                    && !document.getExpiryDate().isBefore(today)
                    && !document.getExpiryDate().isAfter(expiringSoonDate)) {
                candidates.add(
                        buildDriverCandidate(
                                driver,
                                ComplianceIssueType.EXPIRING_SOON,
                                isRequired(
                                                driverComplianceSummaryService
                                                        .getRequiredDocumentTypes(),
                                                document.getDocumentType())
                                        ? ComplianceIssueSeverity.HIGH
                                        : ComplianceIssueSeverity.MEDIUM,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                documentLabel + " is expiring soon.",
                                "Upload a renewed " + documentLabel + " before the expiry date."));
            }
            if (effectiveStatus == DriverDocumentVerificationStatus.REJECTED) {
                candidates.add(
                        buildDriverCandidate(
                                driver,
                                ComplianceIssueType.REJECTED_DOCUMENT,
                                ComplianceIssueSeverity.HIGH,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                documentLabel + " was rejected during review.",
                                "Upload a corrected " + documentLabel + " for another review."));
            }
        }
        return deduplicate(candidates);
    }

    private List<ComplianceIssueCandidate> deriveVehicleCandidates(
            Vehicle vehicle,
            List<VehicleDocument> documents,
            LocalDate today,
            LocalDate expiringSoonDate) {
        List<VehicleDocument> activeDocuments =
                documents.stream()
                        .filter(document -> document.getStatus() == VehicleDocumentStatus.ACTIVE)
                        .toList();
        Map<VehicleDocumentType, List<VehicleDocument>> documentsByType = new HashMap<>();
        for (VehicleDocument document : activeDocuments) {
            documentsByType
                    .computeIfAbsent(document.getDocumentType(), ignored -> new ArrayList<>())
                    .add(document);
        }

        List<ComplianceIssueCandidate> candidates = new ArrayList<>();
        for (VehicleDocumentType requiredType :
                vehicleComplianceSummaryService.getRequiredDocumentTypes()) {
            List<VehicleDocument> typedDocuments =
                    documentsByType.getOrDefault(requiredType, List.of());
            if (typedDocuments.isEmpty()) {
                candidates.add(
                        buildVehicleCandidate(
                                vehicle,
                                ComplianceIssueType.MISSING_REQUIRED_DOCUMENT,
                                ComplianceIssueSeverity.CRITICAL,
                                requiredType.name(),
                                null,
                                "Required vehicle document is missing.",
                                "Upload and verify the missing vehicle document to restore"
                                    + " compliance."));
                continue;
            }
            boolean hasVerified =
                    typedDocuments.stream()
                            .anyMatch(
                                    document ->
                                            VehicleDocumentStatusWorkflow
                                                            .resolveEffectiveVerificationStatus(
                                                                    document, today)
                                                    == VehicleDocumentVerificationStatus.VERIFIED);
            if (!hasVerified) {
                boolean hasPending =
                        typedDocuments.stream()
                                .anyMatch(
                                        document ->
                                                VehicleDocumentStatusWorkflow
                                                                .resolveEffectiveVerificationStatus(
                                                                        document, today)
                                                        == VehicleDocumentVerificationStatus
                                                                .PENDING);
                if (hasPending) {
                    VehicleDocument pendingDocument = typedDocuments.get(0);
                    candidates.add(
                            buildVehicleCandidate(
                                    vehicle,
                                    ComplianceIssueType.UNVERIFIED_DOCUMENT,
                                    ComplianceIssueSeverity.MEDIUM,
                                    requiredType.name(),
                                    pendingDocument.getExpiryDate(),
                                    "Required vehicle document is awaiting verification.",
                                    "Review the pending vehicle document and verify or reject"
                                        + " it."));
                }
            }
        }

        for (VehicleDocument document : activeDocuments) {
            VehicleDocumentVerificationStatus effectiveStatus =
                    VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(
                            document, today);
            if (effectiveStatus == VehicleDocumentVerificationStatus.EXPIRED) {
                candidates.add(
                        buildVehicleCandidate(
                                vehicle,
                                ComplianceIssueType.EXPIRED_DOCUMENT,
                                isRequired(
                                                vehicleComplianceSummaryService
                                                        .getRequiredDocumentTypes(),
                                                document.getDocumentType())
                                        ? ComplianceIssueSeverity.CRITICAL
                                        : ComplianceIssueSeverity.HIGH,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                "Vehicle document has expired.",
                                "Upload a renewed vehicle document and complete verification."));
            } else if (document.getExpiryDate() != null
                    && !document.getExpiryDate().isBefore(today)
                    && !document.getExpiryDate().isAfter(expiringSoonDate)) {
                candidates.add(
                        buildVehicleCandidate(
                                vehicle,
                                ComplianceIssueType.EXPIRING_SOON,
                                isRequired(
                                                vehicleComplianceSummaryService
                                                        .getRequiredDocumentTypes(),
                                                document.getDocumentType())
                                        ? ComplianceIssueSeverity.HIGH
                                        : ComplianceIssueSeverity.MEDIUM,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                "Vehicle document is expiring soon.",
                                "Request a renewed vehicle document before the expiry date."));
            }
            if (effectiveStatus == VehicleDocumentVerificationStatus.REJECTED) {
                candidates.add(
                        buildVehicleCandidate(
                                vehicle,
                                ComplianceIssueType.REJECTED_DOCUMENT,
                                ComplianceIssueSeverity.HIGH,
                                document.getDocumentType().name(),
                                document.getExpiryDate(),
                                "Vehicle document was rejected during review.",
                                "Obtain a corrected vehicle document submission and re-review"
                                    + " it."));
            }
        }
        return deduplicate(candidates);
    }

    private List<ComplianceIssueCandidate> deduplicate(List<ComplianceIssueCandidate> candidates) {
        Map<String, ComplianceIssueCandidate> unique = new LinkedHashMap<>();
        for (ComplianceIssueCandidate candidate : candidates) {
            unique.put(candidate.sourceKey(), candidate);
        }
        return new ArrayList<>(unique.values());
    }

    private ComplianceIssueCandidate buildDriverCandidate(
            Driver driver,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            String relatedDocumentType,
            LocalDate expiryDate,
            String summary,
            String recommendedAction) {
        String entityName = (driver.getFirstName() + " " + driver.getLastName()).trim();
        String sourceKey =
                String.join(
                        ":",
                        driver.getTenantId(),
                        ComplianceEntityType.DRIVER.name(),
                        String.valueOf(driver.getId()),
                        issueType.name(),
                        relatedDocumentType == null ? "NA" : relatedDocumentType);
        return new ComplianceIssueCandidate(
                driver.getTenantId(),
                sourceKey,
                ComplianceEntityType.DRIVER,
                driver.getId(),
                driver.getDriverCode(),
                entityName,
                issueType,
                severity,
                relatedDocumentType,
                expiryDate,
                summary,
                recommendedAction);
    }

    private ComplianceIssueCandidate buildVehicleCandidate(
            Vehicle vehicle,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            String relatedDocumentType,
            LocalDate expiryDate,
            String summary,
            String recommendedAction) {
        String entityName =
                (vehicle.getYear() == null ? "" : vehicle.getYear() + " ")
                        + vehicle.getMake()
                        + " "
                        + vehicle.getModel()
                        + " ("
                        + vehicle.getPlateNumber()
                        + ")";
        String sourceKey =
                String.join(
                        ":",
                        vehicle.getTenantId(),
                        ComplianceEntityType.VEHICLE.name(),
                        String.valueOf(vehicle.getId()),
                        issueType.name(),
                        relatedDocumentType == null ? "NA" : relatedDocumentType);
        return new ComplianceIssueCandidate(
                vehicle.getTenantId(),
                sourceKey,
                ComplianceEntityType.VEHICLE,
                vehicle.getId(),
                vehicle.getVehicleCode(),
                entityName,
                issueType,
                severity,
                relatedDocumentType,
                expiryDate,
                summary,
                recommendedAction);
    }

    private boolean isRequired(Collection<?> requiredTypes, Enum<?> candidateType) {
        return requiredTypes.stream()
                .anyMatch(requiredType -> requiredType.toString().equals(candidateType.name()));
    }

    private String documentLabel(DriverDocumentType documentType) {
        String normalized =
                documentType.name().toLowerCase(java.util.Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private record ComplianceIssueCandidate(
            String tenantId,
            String sourceKey,
            ComplianceEntityType entityType,
            Long entityId,
            String entityCode,
            String entityNameSummary,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            String relatedDocumentType,
            LocalDate expiryDate,
            String summary,
            String recommendedAction) {}
}
