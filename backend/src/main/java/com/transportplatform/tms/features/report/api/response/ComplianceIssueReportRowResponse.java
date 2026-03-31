package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.Instant;
import java.time.LocalDate;

public record ComplianceIssueReportRowResponse(
        Long id,
        ComplianceEntityType entityType,
        String entityCode,
        String entityNameSummary,
        ComplianceIssueType issueType,
        ComplianceIssueSeverity severity,
        ComplianceIssueStatus issueStatus,
        String relatedDocumentType,
        LocalDate expiryDate,
        Instant updatedAt) {
}