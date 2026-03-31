package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RouteAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;

    public RouteAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            RouteRepository routeRepository,
            RouteStopRepository routeStopRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
    }

    public AuthenticatedUser requireCompanyUser() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for this operation.");
        }
        return user;
    }

    public String requireCompanyTenantId() {
        return requireCompanyUser().tenantId();
    }

    public Route findRouteForCompanyScope(Long routeId) {
        String tenantId = requireCompanyTenantId();
        return routeRepository.findByIdAndTenantId(routeId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Route was not found."));
    }

    public RouteStop findRouteStopForCompanyScope(Long routeStopId) {
        String tenantId = requireCompanyTenantId();
        return routeStopRepository.findByIdAndTenantId(routeStopId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Route stop was not found."));
    }
}