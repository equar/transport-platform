package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceAreaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class OrganizationAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final OrganizationRepository organizationRepository;
    private final OrganizationContactRepository organizationContactRepository;
    private final ContractRepository contractRepository;
    private final ServiceAreaRepository serviceAreaRepository;

    public OrganizationAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            OrganizationRepository organizationRepository,
            OrganizationContactRepository organizationContactRepository,
            ContractRepository contractRepository,
            ServiceAreaRepository serviceAreaRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.organizationRepository = organizationRepository;
        this.organizationContactRepository = organizationContactRepository;
        this.contractRepository = contractRepository;
        this.serviceAreaRepository = serviceAreaRepository;
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

    public Organization findOrganizationForCompanyScope(Long organizationId) {
        String tenantId = requireCompanyTenantId();
        return organizationRepository.findByIdAndTenantId(organizationId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Organization was not found."));
    }

    public OrganizationContact findOrganizationContactForCompanyScope(Long contactId) {
        String tenantId = requireCompanyTenantId();
        return organizationContactRepository.findByIdAndTenantId(contactId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Organization contact was not found."));
    }

    public Contract findContractForCompanyScope(Long contractId) {
        String tenantId = requireCompanyTenantId();
        return contractRepository.findByIdAndTenantId(contractId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Contract was not found."));
    }

    public ServiceArea findServiceAreaForCompanyScope(Long serviceAreaId) {
        String tenantId = requireCompanyTenantId();
        return serviceAreaRepository.findByIdAndTenantId(serviceAreaId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Service area was not found."));
    }
}