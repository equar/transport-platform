package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.features.driver.api.response.DriverComplianceSummaryResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
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
import org.springframework.stereotype.Service;

@Service
public class DriverComplianceSummaryService {

    private static final Set<DriverDocumentType> REQUIRED_DOCUMENT_TYPES = EnumSet.of(
            DriverDocumentType.DRIVER_LICENSE,
            DriverDocumentType.BACKGROUND_CHECK,
            DriverDocumentType.DRUG_TEST,
            DriverDocumentType.CONTRACT_AGREEMENT);

    private final DriverDocumentRepository driverDocumentRepository;
    private final Clock clock;

    public DriverComplianceSummaryService(DriverDocumentRepository driverDocumentRepository, Clock clock) {
        this.driverDocumentRepository = driverDocumentRepository;
        this.clock = clock;
    }

    public DriverComplianceSummaryResponse getSummary(String tenantId, Driver driver) {
        return getSummaries(tenantId, List.of(driver)).getOrDefault(driver.getId(), emptySummary());
    }

    public Map<Long, DriverComplianceSummaryResponse> getSummaries(String tenantId, Collection<Driver> drivers) {
        if (drivers.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<DriverDocument>> documentsByDriverId = driverDocumentRepository
                .findAllByTenantIdAndDriver_IdIn(tenantId, drivers.stream().map(Driver::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(document -> document.getDriver().getId()));

        Map<Long, DriverComplianceSummaryResponse> summaries = new LinkedHashMap<>();
        for (Driver driver : drivers) {
            List<DriverDocument> documents = documentsByDriverId.getOrDefault(driver.getId(), List.of());
            summaries.put(driver.getId(), buildSummary(documents));
        }
        return summaries;
    }

    public long countDriversWithExpiredDocuments(String tenantId, Collection<Driver> drivers) {
        return getSummaries(tenantId, drivers).values().stream()
                .filter(summary -> summary.expiredDocumentCount() > 0)
                .count();
    }

    public long countDriversWithMissingRequiredDocuments(String tenantId, Collection<Driver> drivers) {
        return getSummaries(tenantId, drivers).values().stream()
                .filter(summary -> summary.missingRequiredDocumentCount() > 0)
                .count();
    }

    public Set<DriverDocumentType> getRequiredDocumentTypes() {
        return Set.copyOf(REQUIRED_DOCUMENT_TYPES);
    }

    private DriverComplianceSummaryResponse buildSummary(List<DriverDocument> documents) {
        LocalDate today = LocalDate.now(clock);
        List<DriverDocument> activeDocuments = documents.stream()
                .filter(document -> document.getStatus() == DriverDocumentStatus.ACTIVE)
                .toList();

        long verifiedDocumentCount = activeDocuments.stream()
                .filter(document -> DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                        today) == DriverDocumentVerificationStatus.VERIFIED)
                .count();
        long expiredDocumentCount = activeDocuments.stream()
                .filter(document -> DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                        today) == DriverDocumentVerificationStatus.EXPIRED)
                .count();

        Set<DriverDocumentType> missingRequiredDocumentTypes = new LinkedHashSet<>();
        boolean pendingRequiredDocument = false;
        boolean nonCompliantRequiredDocument = false;

        for (DriverDocumentType documentType : REQUIRED_DOCUMENT_TYPES) {
            List<DriverDocument> candidates = activeDocuments.stream()
                    .filter(document -> document.getDocumentType() == documentType)
                    .toList();
            if (candidates.isEmpty()) {
                missingRequiredDocumentTypes.add(documentType);
                continue;
            }
            boolean hasVerified = candidates.stream()
                    .anyMatch(document -> DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                            today) == DriverDocumentVerificationStatus.VERIFIED);
            if (hasVerified) {
                continue;
            }

            boolean hasPending = candidates.stream()
                    .anyMatch(document -> DriverDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                            today) == DriverDocumentVerificationStatus.PENDING);
            if (hasPending) {
                pendingRequiredDocument = true;
            } else {
                nonCompliantRequiredDocument = true;
            }
        }

        DriverComplianceStatus overallStatus;
        if (!missingRequiredDocumentTypes.isEmpty() || expiredDocumentCount > 0 || nonCompliantRequiredDocument) {
            overallStatus = DriverComplianceStatus.NON_COMPLIANT;
        } else if (pendingRequiredDocument) {
            overallStatus = DriverComplianceStatus.ACTION_REQUIRED;
        } else {
            overallStatus = DriverComplianceStatus.COMPLIANT;
        }

        Integer daysUntilNextExpiringDocument = activeDocuments.stream()
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
                Set.copyOf(missingRequiredDocumentTypes));
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
                Set.copyOf(REQUIRED_DOCUMENT_TYPES));
    }
}