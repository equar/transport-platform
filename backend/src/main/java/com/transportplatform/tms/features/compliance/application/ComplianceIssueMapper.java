package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.features.compliance.api.response.ComplianceDashboardSummaryResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueDetailResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueSummaryResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceSeveritySummaryResponse;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ComplianceIssueMapper {

    public ComplianceIssueSummaryResponse toSummary(ComplianceIssue issue) {
        return new ComplianceIssueSummaryResponse(
                issue.getId(),
                issue.getEntityType(),
                issue.getEntityId() == null ? null : issue.getEntityId().toString(),
                issue.getEntityCode(),
                issue.getEntityNameSummary(),
                issue.getIssueType(),
                issue.getSeverity(),
                issue.getRelatedDocumentType(),
                issue.getExpiryDate(),
                issue.getSummary(),
                issue.getIssueStatus(),
                issue.getUpdatedBy(),
                issue.getUpdatedAt());
    }

    public ComplianceIssueDetailResponse toDetail(ComplianceIssue issue) {
        return new ComplianceIssueDetailResponse(
                issue.getId(),
                issue.getTenantId(),
                issue.getSourceKey(),
                issue.getEntityType(),
                issue.getEntityId() == null ? null : issue.getEntityId().toString(),
                issue.getEntityCode(),
                issue.getEntityNameSummary(),
                issue.getIssueType(),
                issue.getSeverity(),
                issue.getRelatedDocumentType(),
                issue.getExpiryDate(),
                issue.getSummary(),
                issue.getRecommendedAction(),
                issue.getIssueStatus(),
                issue.getCreatedBy(),
                issue.getCreatedAt(),
                issue.getUpdatedBy(),
                issue.getUpdatedAt());
    }

    public ComplianceDashboardSummaryResponse toDashboardSummary(long openComplianceIssues,
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
        return new ComplianceDashboardSummaryResponse(
                openComplianceIssues,
                criticalComplianceIssues,
                driversMissingRequiredDocuments,
                driversExpiredDocuments,
                driversDocumentsExpiringSoon,
                vehiclesMissingRequiredDocuments,
                vehiclesExpiredDocuments,
                vehiclesDocumentsExpiringSoon,
                expiredDocuments,
                documentsExpiringSoon,
                severityBreakdown);
    }
}