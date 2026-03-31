package com.transportplatform.tms.features.driverportal.api.response;

import java.util.List;

public record DriverPortalComplianceSummaryResponse(
        long unresolvedComplianceIssues,
        long expiringDocumentsSoon,
        List<DriverPortalComplianceIssueResponse> issues,
        List<DriverPortalDocumentResponse> documents) {
}