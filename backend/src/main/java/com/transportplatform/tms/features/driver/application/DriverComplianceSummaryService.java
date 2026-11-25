package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.features.driver.api.response.DriverComplianceSummaryResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;

import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DriverComplianceSummaryService {
    @org.springframework.beans.factory.annotation.Autowired private DriverDocumentStorageService evidenceStorage;

    private static final Set<DriverDocumentType> REQUIRED_DOCUMENT_TYPES =
            EnumSet.of(
                    DriverDocumentType.DRIVER_LICENSE,
                    DriverDocumentType.BACKGROUND_CHECK,
                    DriverDocumentType.DRUG_TEST,
                    DriverDocumentType.CONTRACT_AGREEMENT);

    private final DriverDocumentRepository driverDocumentRepository;
    private final Clock clock;
    private final com.transportplatform.tms.features.settings.application.TenantTimeService
            tenantTime;

    public DriverComplianceSummaryService(
            DriverDocumentRepository driverDocumentRepository,
            Clock clock,
            com.transportplatform.tms.features.settings.application.TenantTimeService tenantTime) {
        this.driverDocumentRepository = driverDocumentRepository;
        this.clock = clock;
        this.tenantTime = tenantTime;
    }

    public DriverComplianceSummaryResponse getSummary(String tenantId, Driver driver) {
        return getSummaries(tenantId, List.of(driver)).getOrDefault(driver.getId(), emptySummary());
    }

    public Map<Long, DriverComplianceSummaryResponse> getSummaries(
            String tenantId, Collection<Driver> drivers) {
        if (drivers.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<DriverDocument>> documentsByDriverId =
                driverDocumentRepository
                        .findAllByTenantIdAndDriver_IdIn(
                                tenantId, drivers.stream().map(Driver::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(document -> document.getDriver().getId()));

        Map<Long, DriverComplianceSummaryResponse> summaries = new LinkedHashMap<>();
        for (Driver driver : drivers) {
            List<DriverDocument> documents =
                    documentsByDriverId.getOrDefault(driver.getId(), List.of()).stream()
                            .filter(doc -> doc.getVerificationStatus() != DriverDocumentVerificationStatus.VERIFIED
                                    || evidenceStorage.present(tenantId, driver.getId(), doc.getStoragePath())).toList();
            var summary = buildSummary(tenantId, documents);
            Set<String> issues = qualificationIssues(driver, documents, tenantTime.today(tenantId));
            summaries.put(
                    driver.getId(),
                    new DriverComplianceSummaryResponse(
                            summary.requiredDocumentCount(),
                            summary.uploadedDocumentCount(),
                            summary.verifiedDocumentCount(),
                            summary.expiredDocumentCount(),
                            summary.missingRequiredDocumentCount(),
                            issues.isEmpty()
                                    ? summary.overallStatus()
                                    : DriverComplianceStatus.NON_COMPLIANT,
                            summary.daysUntilNextExpiringDocument(),
                            summary.missingRequiredDocumentTypes(),
                            Set.copyOf(issues)));
        }
        return summaries;
    }

    public Set<String> qualificationIssues(
            Driver driver, List<DriverDocument> documents, LocalDate today) {
        Set<String> issues = new LinkedHashSet<>();
        if (driver.getLicenseExpiryDate() == null || driver.getLicenseExpiryDate().isBefore(today))
            issues.add("LICENSE_EXPIRY_REQUIRES_REVIEW");
        if (driver.getBackgroundCheckStatus()
                        != com.transportplatform.tms.features.driver.domain
                                .DriverQualificationStatus.CLEAR
                || driver.getBackgroundCheckExpiryDate() == null
                || driver.getBackgroundCheckExpiryDate().isBefore(today))
            issues.add("BACKGROUND_CHECK_REQUIRES_REVIEW");
        if (driver.getDrugTestStatus()
                        != com.transportplatform.tms.features.driver.domain
                                .DriverQualificationStatus.CLEAR
                || driver.getDrugTestExpiryDate() == null
                || driver.getDrugTestExpiryDate().isBefore(today))
            issues.add("DRUG_TEST_REQUIRES_REVIEW");
        if (driver.getTrainingStatus()
                != com.transportplatform.tms.features.driver.domain.DriverTrainingStatus.COMPLETED)
            issues.add("TRAINING_INCOMPLETE");
        for (var type :
                java.util.List.of(
                        DriverDocumentType.DRIVER_LICENSE,
                        DriverDocumentType.BACKGROUND_CHECK,
                        DriverDocumentType.DRUG_TEST)) {
            var expiry =
                    switch (type) {
                        case DRIVER_LICENSE -> driver.getLicenseExpiryDate();
                        case BACKGROUND_CHECK -> driver.getBackgroundCheckExpiryDate();
                        default -> driver.getDrugTestExpiryDate();
                    };
            var verified =
                    documents.stream()
                            .filter(
                                    doc ->
                                            doc.getDocumentType() == type
                                                    && doc.getStatus()
                                                            == DriverDocumentStatus.ACTIVE
                                                    && DriverDocumentStatusWorkflow
                                                                    .resolveEffectiveVerificationStatus(
                                                                            doc, today)
                                                            == DriverDocumentVerificationStatus
                                                                    .VERIFIED)
                            .toList();
            if (expiry != null
                    && !verified.isEmpty()
                    && verified.stream()
                            .noneMatch(
                                    doc -> java.util.Objects.equals(doc.getExpiryDate(), expiry)))
                issues.add(type.name() + "_RECORD_DOCUMENT_MISMATCH");
        }
        return Set.copyOf(issues);
    }

    public long countDriversWithExpiredDocuments(String tenantId, Collection<Driver> drivers) {
        return getSummaries(tenantId, drivers).values().stream()
                .filter(summary -> summary.expiredDocumentCount() > 0)
                .count();
    }

    public long countDriversWithMissingRequiredDocuments(
            String tenantId, Collection<Driver> drivers) {
        return getSummaries(tenantId, drivers).values().stream()
                .filter(summary -> summary.missingRequiredDocumentCount() > 0)
                .count();
    }

    public Set<DriverDocumentType> getRequiredDocumentTypes() {
        return Set.copyOf(REQUIRED_DOCUMENT_TYPES);
    }

    private DriverComplianceSummaryResponse buildSummary(
            String tenantId, List<DriverDocument> documents) {
        LocalDate today = tenantTime.today(tenantId);
        List<DriverDocument> activeDocuments =
                documents.stream()
                        .filter(document -> document.getStatus() == DriverDocumentStatus.ACTIVE)
                        .toList();

        long verifiedDocumentCount =
                activeDocuments.stream()
                        .filter(
                                document ->
                                        DriverDocumentStatusWorkflow
                                                        .resolveEffectiveVerificationStatus(
                                                                document, today)
                                                == DriverDocumentVerificationStatus.VERIFIED)
                        .count();
        long expiredDocumentCount =
                activeDocuments.stream()
                        .filter(
                                document ->
                                        DriverDocumentStatusWorkflow
                                                        .resolveEffectiveVerificationStatus(
                                                                document, today)
                                                == DriverDocumentVerificationStatus.EXPIRED)
                        .count();

        Set<DriverDocumentType> missingRequiredDocumentTypes = new LinkedHashSet<>();
        boolean pendingRequiredDocument = false;
        boolean nonCompliantRequiredDocument = false;

        for (DriverDocumentType documentType : REQUIRED_DOCUMENT_TYPES) {
            List<DriverDocument> candidates =
                    activeDocuments.stream()
                            .filter(document -> document.getDocumentType() == documentType)
                            .toList();
            if (candidates.isEmpty()) {
                missingRequiredDocumentTypes.add(documentType);
                continue;
            }
            boolean hasVerified =
                    candidates.stream()
                            .anyMatch(
                                    document ->
                                            DriverDocumentStatusWorkflow
                                                            .resolveEffectiveVerificationStatus(
                                                                    document, today)
                                                    == DriverDocumentVerificationStatus.VERIFIED);
            if (hasVerified) {
                continue;
            }

            boolean hasPending =
                    candidates.stream()
                            .anyMatch(
                                    document ->
                                            DriverDocumentStatusWorkflow
                                                            .resolveEffectiveVerificationStatus(
                                                                    document, today)
                                                    == DriverDocumentVerificationStatus.PENDING);
            if (hasPending) {
                pendingRequiredDocument = true;
            } else {
                nonCompliantRequiredDocument = true;
            }
        }

        DriverComplianceStatus overallStatus;
        if (!missingRequiredDocumentTypes.isEmpty()
                || expiredDocumentCount > 0
                || nonCompliantRequiredDocument) {
            overallStatus = DriverComplianceStatus.NON_COMPLIANT;
        } else if (pendingRequiredDocument) {
            overallStatus = DriverComplianceStatus.ACTION_REQUIRED;
        } else {
            overallStatus = DriverComplianceStatus.COMPLIANT;
        }

        Integer daysUntilNextExpiringDocument =
                activeDocuments.stream()
                        .map(DriverDocument::getExpiryDate)
                        .filter(expiryDate -> expiryDate != null && !expiryDate.isBefore(today))
                        .map(expiryDate -> (int) ChronoUnit.DAYS.between(today, expiryDate))
                        .min(Integer::compareTo)
                        .orElse(null);

        return new DriverComplianceSummaryResponse(
                REQUIRED_DOCUMENT_TYPES.size(),
                activeDocuments.size(),
                verifiedDocumentCount,
                expiredDocumentCount,
                missingRequiredDocumentTypes.size(),
                overallStatus,
                daysUntilNextExpiringDocument,
                Set.copyOf(missingRequiredDocumentTypes),
                Set.of());
    }

    private DriverComplianceSummaryResponse emptySummary() {
        return new DriverComplianceSummaryResponse(
                REQUIRED_DOCUMENT_TYPES.size(),
                0,
                0,
                0,
                REQUIRED_DOCUMENT_TYPES.size(),
                DriverComplianceStatus.NON_COMPLIANT,
                null,
                Set.copyOf(REQUIRED_DOCUMENT_TYPES),
                Set.of());
    }
}
