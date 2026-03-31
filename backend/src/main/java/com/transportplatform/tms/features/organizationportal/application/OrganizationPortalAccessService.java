package com.transportplatform.tms.features.organizationportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrganizationPortalAccessService {

    private final PortalAccessService portalAccessService;
    private final OrganizationContactRepository organizationContactRepository;

    public OrganizationPortalAccessService(PortalAccessService portalAccessService,
            OrganizationContactRepository organizationContactRepository) {
        this.portalAccessService = portalAccessService;
        this.organizationContactRepository = organizationContactRepository;
    }

    @Transactional(readOnly = true)
    public ResolvedOrganizationPortalScope resolveCurrentScope() {
        var resolved = portalAccessService.requireCurrentScope(
                PortalAccessService.organizationRoles(),
                java.util.Set.of(PortalSubjectType.ORGANIZATION_CONTACT));
        OrganizationContact contact = organizationContactRepository
                .findByIdAndTenantId(resolved.scope().getPortalSubjectId(), resolved.user().tenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "The linked organization contact could not be found."));
        return new ResolvedOrganizationPortalScope(resolved.user(), contact);
    }

    public record ResolvedOrganizationPortalScope(
            com.transportplatform.tms.common.security.AuthenticatedUser user,
            OrganizationContact contact) {
    }
}