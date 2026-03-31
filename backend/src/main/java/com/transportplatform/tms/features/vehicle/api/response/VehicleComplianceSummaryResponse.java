package com.transportplatform.tms.features.vehicle.api.response;

import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import java.util.Set;

public record VehicleComplianceSummaryResponse(
        long requiredDocumentCount,
        long uploadedDocumentCount,
        long verifiedDocumentCount,
        long expiredDocumentCount,
        long missingRequiredDocumentCount,
        VehicleComplianceStatus overallStatus,
        Integer daysUntilNextExpiringDocument,
        Set<VehicleDocumentType> missingRequiredDocumentTypes) {
}