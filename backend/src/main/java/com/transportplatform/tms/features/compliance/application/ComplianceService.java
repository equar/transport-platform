package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.api.response.ComplianceDashboardSummaryResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueDetailResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueSummaryResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceSeveritySummaryResponse;
import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplianceService {

    private static final Set<ComplianceIssueStatus> ACTIVE_STATUSES = Set.of(
            ComplianceIssueStatus.OPEN,
            ComplianceIssueStatus.ACKNOWLEDGED);

    private final ComplianceIssueRepository complianceIssueRepository;
    private final ComplianceAccessService complianceAccessService;
    private final ComplianceIssueSyncService complianceIssueSyncService;
    private final ComplianceIssueMapper complianceIssueMapper;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public ComplianceService(ComplianceIssueRepository complianceIssueRepository,
            ComplianceAccessService complianceAccessService,
            ComplianceIssueSyncService complianceIssueSyncService,
            ComplianceIssueMapper complianceIssueMapper,
            AuditLogService auditLogService,
            Clock clock) {
        this.complianceIssueRepository = complianceIssueRepository;
        this.complianceAccessService = complianceAccessService;
        this.complianceIssueSyncService = complianceIssueSyncService;
        this.complianceIssueMapper = complianceIssueMapper;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional
    public ComplianceDashboardSummaryResponse getCompanyComplianceSummary() {
        AuthenticatedUser user = complianceAccessService.requireCompanyAdmin();
        List<ComplianceIssue> issues = complianceIssueSyncService.synchronizeTenantIssues(user.tenantId());
        return buildSummary(issues);
    }

    @Transactional
    public PageResponse<ComplianceIssueSummaryResponse> searchCompanyIssues(String keyword,
            ComplianceEntityType entityType,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            ComplianceIssueStatus issueStatus,
            Boolean expiredOnly,
            Boolean expiringSoonOnly,
            LocalDate expiryFrom,
            LocalDate expiryTo,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        AuthenticatedUser user = complianceAccessService.requireCompanyAdmin();
        LocalDate today = LocalDate.now(clock);
        complianceIssueSyncService.synchronizeTenantIssues(user.tenantId());
        return PageResponse.from(complianceIssueRepository.findAll(
                ComplianceIssueSpecifications.search(
                        user.tenantId(),
                        keyword,
                        entityType,
                        issueType,
                        severity,
                        issueStatus,
                        expiredOnly,
                        expiringSoonOnly,
                        expiryFrom,
                        expiryTo,
                        today,
                        today.plusDays(30)),
                PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy))))
                .map(complianceIssueMapper::toSummary));
    }

    @Transactional
    public ComplianceIssueDetailResponse getCompanyIssue(Long issueId) {
        AuthenticatedUser user = complianceAccessService.requireCompanyAdmin();
        complianceIssueSyncService.synchronizeTenantIssues(user.tenantId());
        return complianceIssueMapper.toDetail(complianceAccessService.findCompanyIssue(issueId));
    }

    @Transactional
    public ComplianceIssueDetailResponse acknowledgeCompanyIssue(Long issueId) {
        ComplianceIssue issue = complianceAccessService.findCompanyIssue(issueId);
        ComplianceIssueStatusWorkflow.ensureCanAcknowledge(issue);
        return updateStatus(issue, ComplianceIssueStatus.ACKNOWLEDGED, "ACKNOWLEDGED",
                "Compliance issue was acknowledged.");
    }

    @Transactional
    public ComplianceIssueDetailResponse resolveCompanyIssue(Long issueId) {
        ComplianceIssue issue = complianceAccessService.findCompanyIssue(issueId);
        ComplianceIssueStatusWorkflow.ensureCanResolve(issue);
        return updateStatus(issue, ComplianceIssueStatus.RESOLVED, "RESOLVED",
                "Compliance issue was resolved.");
    }

    @Transactional
    public ComplianceIssueDetailResponse dismissCompanyIssue(Long issueId) {
        ComplianceIssue issue = complianceAccessService.findCompanyIssue(issueId);
        ComplianceIssueStatusWorkflow.ensureCanDismiss(issue);
        return updateStatus(issue, ComplianceIssueStatus.DISMISSED, "DISMISSED",
                "Compliance issue was dismissed.");
    }

    private ComplianceIssueDetailResponse updateStatus(ComplianceIssue issue,
            ComplianceIssueStatus nextStatus,
            String action,
            String summary) {
        Object oldValue = Map.of("issueStatus", issue.getIssueStatus().name());
        issue.setIssueStatus(nextStatus);
        ComplianceIssue saved = complianceIssueRepository.save(issue);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getTenantId(),
                "COMPLIANCE",
                action,
                "COMPLIANCE_ISSUE",
                saved.getId().toString(),
                summary,
                oldValue,
                Map.of("issueStatus", saved.getIssueStatus().name())));
        return complianceIssueMapper.toDetail(saved);
    }

    private ComplianceDashboardSummaryResponse buildSummary(List<ComplianceIssue> issues) {
        List<ComplianceIssue> activeIssues = issues.stream()
                .filter(issue -> ACTIVE_STATUSES.contains(issue.getIssueStatus()))
                .toList();

        long openComplianceIssues = activeIssues.size();
        long criticalComplianceIssues = activeIssues.stream()
                .filter(issue -> issue.getSeverity() == ComplianceIssueSeverity.CRITICAL)
                .count();
        long driversMissingRequiredDocuments = count(activeIssues, ComplianceEntityType.DRIVER,
                ComplianceIssueType.MISSING_REQUIRED_DOCUMENT);
        long driversExpiredDocuments = count(activeIssues, ComplianceEntityType.DRIVER,
                ComplianceIssueType.EXPIRED_DOCUMENT);
        long driversDocumentsExpiringSoon = count(activeIssues, ComplianceEntityType.DRIVER,
                ComplianceIssueType.EXPIRING_SOON);
        long vehiclesMissingRequiredDocuments = count(activeIssues, ComplianceEntityType.VEHICLE,
                ComplianceIssueType.MISSING_REQUIRED_DOCUMENT);
        long vehiclesExpiredDocuments = count(activeIssues, ComplianceEntityType.VEHICLE,
                ComplianceIssueType.EXPIRED_DOCUMENT);
        long vehiclesDocumentsExpiringSoon = count(activeIssues, ComplianceEntityType.VEHICLE,
                ComplianceIssueType.EXPIRING_SOON);
        long expiredDocuments = activeIssues.stream()
                .filter(issue -> issue.getIssueType() == ComplianceIssueType.EXPIRED_DOCUMENT)
                .count();
        long documentsExpiringSoon = activeIssues.stream()
                .filter(issue -> issue.getIssueType() == ComplianceIssueType.EXPIRING_SOON)
                .count();

        List<ComplianceSeveritySummaryResponse> severityBreakdown = Arrays.stream(ComplianceIssueSeverity.values())
                .map(severity -> new ComplianceSeveritySummaryResponse(
                        severity,
                        activeIssues.stream().filter(issue -> issue.getSeverity() == severity).count()))
                .toList();

        return complianceIssueMapper.toDashboardSummary(
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

    private long count(List<ComplianceIssue> issues,
            ComplianceEntityType entityType,
            ComplianceIssueType issueType) {
        return issues.stream()
                .filter(issue -> issue.getEntityType() == entityType && issue.getIssueType() == issueType)
                .count();
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "updatedAt", "createdAt", "severity", "issueStatus", "entityCode", "expiryDate" -> resolved;
            default -> "updatedAt";
        };
    }
}