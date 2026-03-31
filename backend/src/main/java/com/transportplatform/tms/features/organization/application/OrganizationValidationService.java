package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class OrganizationValidationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationValidationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public Organization requireOrganizationForTenant(String tenantId, Long organizationId) {
        return organizationRepository.findByIdAndTenantId(organizationId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Organization was not found."));
    }

    public void validateRiderOrganizationLink(String tenantId, Long organizationId) {
        if (organizationId == null) {
            return;
        }
        requireOrganizationForTenant(tenantId, organizationId);
    }
}