package com.transportplatform.tms.features.report.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ReportAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final com.transportplatform.tms.features.saas.application.TenantModulePolicy modules;

    public ReportAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService, com.transportplatform.tms.features.saas.application.TenantModulePolicy modules) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.modules = modules;
    }

    public AuthenticatedUser requireCompanyAdmin() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "A company administrator account is required for report access.");
        }
        modules.requireEnabled(user.tenantId(), "REPORTS");
        return user;
    }
    public boolean canAccess(AuthenticatedUser user, com.transportplatform.tms.features.report.domain.ReportType type) {
        var roles = user.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        if (roles.contains("ROLE_TENANT_ADMIN")) return true;
        return switch (type) {
            case INVOICE, PAYMENT -> roles.contains("ROLE_BILLING_ADMIN");
            case COMPLIANCE, INCIDENT -> roles.contains("ROLE_COMPLIANCE_ADMIN");
            default -> false;
        };
    }
    public AuthenticatedUser requireReport(com.transportplatform.tms.features.report.domain.ReportType type) {
        var user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.tenantId() == null || user.tenantId().isBlank() || !canAccess(user, type))
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "Your account cannot access this report.");
        modules.requireEnabled(user.tenantId(), "REPORTS");
        return user;
    }
    public AuthenticatedUser requireReportUser() {
        var user = currentAuthenticatedUserService.requireCurrentUser();
        if (java.util.Arrays.stream(com.transportplatform.tms.features.report.domain.ReportType.values()).noneMatch(t -> canAccess(user, t))
                || user.tenantId() == null || user.tenantId().isBlank())
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "Your account cannot access reports.");
        modules.requireEnabled(user.tenantId(), "REPORTS");
        return user;
    }
    public void requireModule(String tenantId, String module) { modules.requireEnabled(tenantId, module); }
}
