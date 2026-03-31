package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VehicleAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final VehicleRepository vehicleRepository;

    public VehicleAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            VehicleRepository vehicleRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.vehicleRepository = vehicleRepository;
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

    public Vehicle findVehicleForCompanyScope(Long vehicleId) {
        String tenantId = requireCompanyTenantId();
        return vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Vehicle was not found."));
    }
}