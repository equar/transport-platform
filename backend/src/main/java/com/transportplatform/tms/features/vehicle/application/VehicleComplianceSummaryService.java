package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.vehicle.api.response.VehicleComplianceSummaryResponse;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
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
public class VehicleComplianceSummaryService {

    private static final Set<VehicleDocumentType> REQUIRED_DOCUMENT_TYPES = EnumSet.of(
            VehicleDocumentType.VEHICLE_REGISTRATION,
            VehicleDocumentType.VEHICLE_INSURANCE,
            VehicleDocumentType.VEHICLE_INSPECTION);

    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final Clock clock;

    public VehicleComplianceSummaryService(VehicleDocumentRepository vehicleDocumentRepository, Clock clock) {
        this.vehicleDocumentRepository = vehicleDocumentRepository;
        this.clock = clock;
    }

    public VehicleComplianceSummaryResponse getSummary(String tenantId, Vehicle vehicle) {
        return getSummaries(tenantId, List.of(vehicle)).getOrDefault(vehicle.getId(), emptySummary());
    }

    public Map<Long, VehicleComplianceSummaryResponse> getSummaries(String tenantId, Collection<Vehicle> vehicles) {
        if (vehicles.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<VehicleDocument>> documentsByVehicleId = vehicleDocumentRepository
                .findAllByTenantIdAndVehicle_IdIn(tenantId, vehicles.stream().map(Vehicle::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(document -> document.getVehicle().getId()));

        Map<Long, VehicleComplianceSummaryResponse> summaries = new LinkedHashMap<>();
        for (Vehicle vehicle : vehicles) {
            List<VehicleDocument> documents = documentsByVehicleId.getOrDefault(vehicle.getId(), List.of());
            summaries.put(vehicle.getId(), buildSummary(documents));
        }
        return summaries;
    }

    public long countVehiclesWithExpiredDocuments(String tenantId, Collection<Vehicle> vehicles) {
        return getSummaries(tenantId, vehicles).values().stream()
                .filter(summary -> summary.expiredDocumentCount() > 0)
                .count();
    }

    public long countVehiclesWithMissingRequiredDocuments(String tenantId, Collection<Vehicle> vehicles) {
        return getSummaries(tenantId, vehicles).values().stream()
                .filter(summary -> summary.missingRequiredDocumentCount() > 0)
                .count();
    }

    public Set<VehicleDocumentType> getRequiredDocumentTypes() {
        return Set.copyOf(REQUIRED_DOCUMENT_TYPES);
    }

    private VehicleComplianceSummaryResponse buildSummary(List<VehicleDocument> documents) {
        LocalDate today = LocalDate.now(clock);
        List<VehicleDocument> activeDocuments = documents.stream()
                .filter(document -> document.getStatus() == VehicleDocumentStatus.ACTIVE)
                .toList();

        long verifiedDocumentCount = activeDocuments.stream()
                .filter(document -> VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                        today) == VehicleDocumentVerificationStatus.VERIFIED)
                .count();
        long expiredDocumentCount = activeDocuments.stream()
                .filter(document -> VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                        today) == VehicleDocumentVerificationStatus.EXPIRED)
                .count();

        Set<VehicleDocumentType> missingRequiredDocumentTypes = new LinkedHashSet<>();
        boolean pendingRequiredDocument = false;
        boolean nonCompliantRequiredDocument = false;

        for (VehicleDocumentType documentType : REQUIRED_DOCUMENT_TYPES) {
            List<VehicleDocument> candidates = activeDocuments.stream()
                    .filter(document -> document.getDocumentType() == documentType)
                    .toList();
            if (candidates.isEmpty()) {
                missingRequiredDocumentTypes.add(documentType);
                continue;
            }
            boolean hasVerified = candidates.stream()
                    .anyMatch(document -> VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                            today) == VehicleDocumentVerificationStatus.VERIFIED);
            if (hasVerified) {
                continue;
            }

            boolean hasPending = candidates.stream()
                    .anyMatch(document -> VehicleDocumentStatusWorkflow.resolveEffectiveVerificationStatus(document,
                            today) == VehicleDocumentVerificationStatus.PENDING);
            if (hasPending) {
                pendingRequiredDocument = true;
            } else {
                nonCompliantRequiredDocument = true;
            }
        }

        VehicleComplianceStatus overallStatus;
        if (!missingRequiredDocumentTypes.isEmpty() || expiredDocumentCount > 0 || nonCompliantRequiredDocument) {
            overallStatus = VehicleComplianceStatus.NON_COMPLIANT;
        } else if (pendingRequiredDocument) {
            overallStatus = VehicleComplianceStatus.ACTION_REQUIRED;
        } else {
            overallStatus = VehicleComplianceStatus.COMPLIANT;
        }

        Integer daysUntilNextExpiringDocument = activeDocuments.stream()
                .map(VehicleDocument::getExpiryDate)
                .filter(expiryDate -> expiryDate != null && !expiryDate.isBefore(today))
                .map(expiryDate -> (int) ChronoUnit.DAYS.between(today, expiryDate))
                .min(Integer::compareTo)
                .orElse(null);

        return new VehicleComplianceSummaryResponse(
                REQUIRED_DOCUMENT_TYPES.size(),
                activeDocuments.size(),
                verifiedDocumentCount,
                expiredDocumentCount,
                missingRequiredDocumentTypes.size(),
                overallStatus,
                daysUntilNextExpiringDocument,
                Set.copyOf(missingRequiredDocumentTypes));
    }

    private VehicleComplianceSummaryResponse emptySummary() {
        return new VehicleComplianceSummaryResponse(
                REQUIRED_DOCUMENT_TYPES.size(),
                0,
                0,
                0,
                REQUIRED_DOCUMENT_TYPES.size(),
                VehicleComplianceStatus.NON_COMPLIANT,
                null,
                Set.copyOf(REQUIRED_DOCUMENT_TYPES));
    }
}