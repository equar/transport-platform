package com.transportplatform.tms.features.riderguardianportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RiderGuardianPortalAccessService {

    private final PortalAccessService portalAccessService;
    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final RiderGuardianRepository riderGuardianRepository;

    public RiderGuardianPortalAccessService(PortalAccessService portalAccessService,
            RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            RiderGuardianRepository riderGuardianRepository) {
        this.portalAccessService = portalAccessService;
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.riderGuardianRepository = riderGuardianRepository;
    }

    @Transactional(readOnly = true)
    public ResolvedRiderGuardianScope resolveCurrentScope() {
        var resolved = portalAccessService.requireCurrentScope(
                PortalAccessService.riderRoles(),
                java.util.Set.of(PortalSubjectType.RIDER, PortalSubjectType.GUARDIAN));
        return switch (resolved.scope().getPortalSubjectType()) {
            case RIDER -> resolveRiderScope(resolved);
            case GUARDIAN -> resolveGuardianScope(resolved);
            default -> throw forbidden("The current portal scope is not valid for rider or guardian access.");
        };
    }

    private ResolvedRiderGuardianScope resolveRiderScope(PortalAccessService.ResolvedPortalScope resolved) {
        Rider rider = riderRepository
                .findByIdAndTenantId(resolved.scope().getPortalSubjectId(), resolved.user().tenantId())
                .orElseThrow(() -> notFound("The linked rider profile could not be found."));
        List<RiderGuardian> links = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        rider.getTenantId(),
                        rider.getId(),
                        RiderGuardianStatus.ACTIVE);
        return new ResolvedRiderGuardianScope(resolved.user(), PortalSubjectType.RIDER, rider, null, links,
                List.of(rider));
    }

    private ResolvedRiderGuardianScope resolveGuardianScope(PortalAccessService.ResolvedPortalScope resolved) {
        Guardian guardian = guardianRepository
                .findByIdAndTenantId(resolved.scope().getPortalSubjectId(), resolved.user().tenantId())
                .orElseThrow(() -> notFound("The linked guardian profile could not be found."));
        List<RiderGuardian> links = riderGuardianRepository
                .findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        guardian.getTenantId(),
                        guardian.getId(),
                        RiderGuardianStatus.ACTIVE);
        List<Rider> linkedRiders = links.stream()
                .map(RiderGuardian::getRider)
                .toList();
        return new ResolvedRiderGuardianScope(resolved.user(), PortalSubjectType.GUARDIAN, null, guardian, links,
                linkedRiders);
    }

    private ApiException notFound(String message) {
        return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    private ApiException forbidden(String message) {
        return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, message);
    }

    public record ResolvedRiderGuardianScope(
            com.transportplatform.tms.common.security.AuthenticatedUser user,
            PortalSubjectType scopeType,
            Rider rider,
            Guardian guardian,
            List<RiderGuardian> links,
            List<Rider> linkedRiders) {
    }
}