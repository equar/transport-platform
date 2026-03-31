package com.transportplatform.tms.features.compliance.api.response;

import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.Instant;
import java.time.LocalDate;

public record ComplianceIssueDetailResponse(
        Long id,
        String tenantId,
        String sourceKey,
        ComplianceEntityType entityType,
        String entityId,
        String entityCode,
        String entityNameSummary,
        ComplianceIssueType issueType,
        ComplianceIssueSeverity severity,
        String relatedDocumentType,
        LocalDate expiryDate,
        String summary,
        String recommendedAction,
        ComplianceIssueStatus issueStatus,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}