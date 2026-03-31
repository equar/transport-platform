package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ComplianceAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final ComplianceIssueRepository complianceIssueRepository;

    public ComplianceAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            ComplianceIssueRepository complianceIssueRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.complianceIssueRepository = complianceIssueRepository;
    }

    public AuthenticatedUser requireCompanyAdmin() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for compliance access.");
        }
        return user;
    }

    public ComplianceIssue findCompanyIssue(Long issueId) {
        AuthenticatedUser user = requireCompanyAdmin();
        return complianceIssueRepository.findByIdAndTenantId(issueId, user.tenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Compliance issue was not found."));
    }
}