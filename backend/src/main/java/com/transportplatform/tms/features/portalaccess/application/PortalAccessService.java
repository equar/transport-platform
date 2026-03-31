package com.transportplatform.tms.features.portalaccess.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScope;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScopeRepository;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import java.util.Arrays;
import java.util.Collection;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PortalAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final PortalUserScopeRepository portalUserScopeRepository;
    private final DriverRepository driverRepository;
    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationContactRepository organizationContactRepository;

    public PortalAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            PortalUserScopeRepository portalUserScopeRepository,
            DriverRepository driverRepository,
            RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            OrganizationContactRepository organizationContactRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.portalUserScopeRepository = portalUserScopeRepository;
        this.driverRepository = driverRepository;
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.organizationContactRepository = organizationContactRepository;
    }

    @Transactional(readOnly = true)
    public ResolvedPortalScope requireCurrentScope(Collection<RoleName> allowedRoles,
            Collection<PortalSubjectType> allowedSubjectTypes) {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.id() == null || user.tenantId() == null || user.tenantId().isBlank()) {
            throw forbidden("A tenant-scoped portal account is required for this operation.");
        }
        boolean hasAllowedRole = user.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(authority -> allowedRoles.stream().map(Enum::name).anyMatch(authority::equals));
        if (!hasAllowedRole) {
            throw forbidden("This portal operation is not available for the current account role.");
        }
        PortalUserScope scope = portalUserScopeRepository.findByAppUserId(user.id())
                .orElseThrow(() -> forbidden("The current portal account is not linked to a scoped portal identity."));
        if (!user.tenantId().equals(scope.getTenantId())) {
            throw forbidden("Portal scope resolution failed for the current tenant.");
        }
        if (!allowedSubjectTypes.contains(scope.getPortalSubjectType())) {
            throw forbidden("This portal operation is not available for the linked portal identity.");
        }
        validateSubjectExists(scope);
        return new ResolvedPortalScope(user, scope);
    }

    @Transactional
    public void upsertScope(Long appUserId,
            String tenantId,
            PortalSubjectType portalSubjectType,
            Long portalSubjectId) {
        validateSubjectExists(tenantId, portalSubjectType, portalSubjectId);
        PortalUserScope scope = portalUserScopeRepository.findByAppUserId(appUserId).orElseGet(PortalUserScope::new);
        scope.setAppUserId(appUserId);
        scope.setTenantId(tenantId);
        scope.setPortalSubjectType(portalSubjectType);
        scope.setPortalSubjectId(portalSubjectId);
        portalUserScopeRepository.save(scope);
    }

    @Transactional
    public void removeScope(Long appUserId) {
        portalUserScopeRepository.findByAppUserId(appUserId).ifPresent(portalUserScopeRepository::delete);
    }

    public static Collection<RoleName> driverRoles() {
        return Set.of(RoleName.ROLE_DRIVER);
    }

    public static Collection<RoleName> riderRoles() {
        return Set.of(RoleName.ROLE_RIDER, RoleName.ROLE_GUARDIAN);
    }

    public static Collection<RoleName> organizationRoles() {
        return Set.of(RoleName.ROLE_ORGANIZATION_USER);
    }

    private void validateSubjectExists(PortalUserScope scope) {
        validateSubjectExists(scope.getTenantId(), scope.getPortalSubjectType(), scope.getPortalSubjectId());
    }

    private void validateSubjectExists(String tenantId, PortalSubjectType portalSubjectType, Long portalSubjectId) {
        boolean exists = switch (portalSubjectType) {
            case DRIVER -> driverRepository.findByIdAndTenantId(portalSubjectId, tenantId).isPresent();
            case RIDER -> riderRepository.findByIdAndTenantId(portalSubjectId, tenantId).isPresent();
            case GUARDIAN -> guardianRepository.findByIdAndTenantId(portalSubjectId, tenantId).isPresent();
            case ORGANIZATION_CONTACT -> organizationContactRepository.findByIdAndTenantId(portalSubjectId, tenantId)
                    .isPresent();
        };
        if (!exists) {
            throw new ApiException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    HttpStatus.NOT_FOUND,
                    "The selected portal subject could not be found in the current tenant.");
        }
    }

    private ApiException forbidden(String message) {
        return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, message);
    }

    public record ResolvedPortalScope(AuthenticatedUser user, PortalUserScope scope) {
    }
}