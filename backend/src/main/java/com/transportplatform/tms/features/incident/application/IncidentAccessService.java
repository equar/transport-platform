package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.incident.domain.IncidentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class IncidentAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final IncidentRepository incidentRepository;

    public IncidentAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            IncidentRepository incidentRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.incidentRepository = incidentRepository;
    }

    public AuthenticatedUser requireCompanyAdmin() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for incident access.");
        }
        return user;
    }

    public Incident findCompanyIncident(Long incidentId) {
        AuthenticatedUser user = requireCompanyAdmin();
        return incidentRepository.findByIdAndTenantId(incidentId, user.tenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Incident was not found."));
    }
}