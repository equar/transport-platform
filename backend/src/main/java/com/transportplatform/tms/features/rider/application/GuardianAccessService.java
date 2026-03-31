package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class GuardianAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final GuardianRepository guardianRepository;

    public GuardianAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            GuardianRepository guardianRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.guardianRepository = guardianRepository;
    }

    public String requireCompanyTenantId() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for this operation.");
        }
        return user.tenantId();
    }

    public Guardian findGuardianForCompanyScope(Long guardianId) {
        String tenantId = requireCompanyTenantId();
        return guardianRepository.findByIdAndTenantId(guardianId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Guardian was not found."));
    }
}