package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class DriverAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final DriverRepository driverRepository;

    public DriverAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            DriverRepository driverRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.driverRepository = driverRepository;
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

    public Driver findDriverForCompanyScope(Long driverId) {
        String tenantId = requireCompanyTenantId();
        return driverRepository.findByIdAndTenantId(driverId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Driver was not found."));
    }
}