package com.transportplatform.tms.features.compliance.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceDashboardSummaryResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueDetailResponse;
import com.transportplatform.tms.features.compliance.api.response.ComplianceIssueSummaryResponse;
import com.transportplatform.tms.features.compliance.application.ComplianceService;
import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.LocalDate;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ComplianceManagementController {

    private final ComplianceService complianceService;

    public ComplianceManagementController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    @GetMapping("/company/compliance/summary")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ComplianceDashboardSummaryResponse> getCompanyComplianceSummary() {
        return ApiResponse.success(complianceService.getCompanyComplianceSummary());
    }

    @GetMapping("/company/compliance/issues")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<ComplianceIssueSummaryResponse>> searchCompanyIssues(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ComplianceEntityType entityType,
            @RequestParam(required = false) ComplianceIssueType issueType,
            @RequestParam(required = false) ComplianceIssueSeverity severity,
            @RequestParam(required = false) ComplianceIssueStatus issueStatus,
            @RequestParam(required = false) Boolean expiredOnly,
            @RequestParam(required = false) Boolean expiringSoonOnly,
            @RequestParam(required = false) LocalDate expiryFrom,
            @RequestParam(required = false) LocalDate expiryTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(complianceService.searchCompanyIssues(
                keyword,
                entityType,
                issueType,
                severity,
                issueStatus,
                expiredOnly,
                expiringSoonOnly,
                expiryFrom,
                expiryTo,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/compliance/issues/{issueId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ComplianceIssueDetailResponse> getCompanyIssue(@PathVariable Long issueId) {
        return ApiResponse.success(complianceService.getCompanyIssue(issueId));
    }

    @PostMapping("/company/compliance/issues/{issueId}/acknowledge")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ComplianceIssueDetailResponse> acknowledgeCompanyIssue(@PathVariable Long issueId) {
        return ApiResponse.success(complianceService.acknowledgeCompanyIssue(issueId));
    }

    @PostMapping("/company/compliance/issues/{issueId}/resolve")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ComplianceIssueDetailResponse> resolveCompanyIssue(@PathVariable Long issueId) {
        return ApiResponse.success(complianceService.resolveCompanyIssue(issueId));
    }

    @PostMapping("/company/compliance/issues/{issueId}/dismiss")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<ComplianceIssueDetailResponse> dismissCompanyIssue(@PathVariable Long issueId) {
        return ApiResponse.success(complianceService.dismissCompanyIssue(issueId));
    }
}