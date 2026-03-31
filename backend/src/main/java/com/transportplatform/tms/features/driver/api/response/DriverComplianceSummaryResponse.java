package com.transportplatform.tms.features.driver.api.response;

import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import java.util.Set;

public record DriverComplianceSummaryResponse(
        long requiredDocumentCount,
        long uploadedDocumentCount,
        long verifiedDocumentCount,
        long expiredDocumentCount,
        long missingRequiredDocumentCount,
        DriverComplianceStatus overallStatus,
        Integer daysUntilNextExpiringDocument,
        Set<DriverDocumentType> missingRequiredDocumentTypes) {
}