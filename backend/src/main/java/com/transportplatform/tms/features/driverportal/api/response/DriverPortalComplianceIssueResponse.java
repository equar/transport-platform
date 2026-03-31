package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.LocalDate;
import java.time.Instant;

public record DriverPortalComplianceIssueResponse(
        Long id,
        ComplianceIssueType issueType,
        ComplianceIssueSeverity severity,
        ComplianceIssueStatus issueStatus,
        String summary,
        String recommendedAction,
        String relatedDocumentType,
        LocalDate expiryDate,
        Instant updatedAt) {
}