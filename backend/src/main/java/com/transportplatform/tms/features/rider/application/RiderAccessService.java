package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RiderAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final RiderRepository riderRepository;

    public RiderAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            RiderRepository riderRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.riderRepository = riderRepository;
    }

    public String requireCompanyTenantId() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean authorizedCompanyRole = user.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(authority -> authority.equals(RoleName.ROLE_TENANT_ADMIN.name())
                        || authority.equals(RoleName.ROLE_DISPATCHER.name()));
        if (!authorizedCompanyRole || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "An authorized tenant-scoped company role is required for this operation.");
        }
        return user.tenantId();
    }

    public Rider findRiderForCompanyScope(Long riderId) {
        String tenantId = requireCompanyTenantId();
        return riderRepository.findByIdAndTenantId(riderId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Rider was not found."));
    }
}
