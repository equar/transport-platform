package com.transportplatform.tms.features.compliance.api.response;

import java.util.List;

public record ComplianceDashboardSummaryResponse(
        long openComplianceIssues,
        long criticalComplianceIssues,
        long driversMissingRequiredDocuments,
        long driversExpiredDocuments,
        long driversDocumentsExpiringSoon,
        long vehiclesMissingRequiredDocuments,
        long vehiclesExpiredDocuments,
        long vehiclesDocumentsExpiringSoon,
        long expiredDocuments,
        long documentsExpiringSoon,
        List<ComplianceSeveritySummaryResponse> severityBreakdown) {
}