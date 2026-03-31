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

    public ReportAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
    }

    public AuthenticatedUser requireCompanyAdmin() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "A company administrator account is required for report access.");
        }
        return user;
    }
}