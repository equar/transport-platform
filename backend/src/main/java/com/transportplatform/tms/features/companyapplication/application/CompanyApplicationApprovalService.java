package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationReviewRequest;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import com.transportplatform.tms.features.tenant.application.TenantService;
import java.util.LinkedHashSet;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyApplicationApprovalService {

    private final TenantService tenantService;
    private final TenantCodeGenerator tenantCodeGenerator;
    private final TenantOwnerProvisioningService tenantOwnerProvisioningService;

    public CompanyApplicationApprovalService(TenantService tenantService,
            TenantCodeGenerator tenantCodeGenerator,
            TenantOwnerProvisioningService tenantOwnerProvisioningService) {
        this.tenantService = tenantService;
        this.tenantCodeGenerator = tenantCodeGenerator;
        this.tenantOwnerProvisioningService = tenantOwnerProvisioningService;
    }

    @Transactional
    public ApprovalResult approve(CompanyApplication application, CompanyApplicationReviewRequest request) {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID().toString());
        tenant.setTenantCode(tenantCodeGenerator.generate(application.getLegalCompanyName(), request.tenantCode()));
        tenant.setCompanyName(application.getDbaName() == null || application.getDbaName().isBlank()
                ? application.getLegalCompanyName()
                : application.getDbaName());
        tenant.setLegalName(application.getLegalCompanyName());
        tenant.setEmail(application.getEmail());
        tenant.setPhone(application.getPhone());
        tenant.setAddressLine1(application.getAddressLine1());
        tenant.setAddressLine2(application.getAddressLine2());
        tenant.setCity(application.getCity());
        tenant.setState(application.getState());
        tenant.setZipCode(application.getZipCode());
        tenant.setCountry(application.getCountry());
        tenant.setBusinessType(application.getBusinessType());
        tenant.setSubscriptionPlan(request.subscriptionPlan() == null || request.subscriptionPlan().isBlank()
                ? "STARTER"
                : request.subscriptionPlan().trim().toUpperCase());
        tenant.setServiceTypesEnabled(new LinkedHashSet<>(application.getRequestedServiceTypes()));
        tenant.setNotes(application.getNotes());
        tenant.setStatus(TenantStatus.PENDING);

        Tenant savedTenant = tenantService.createFromApplication(tenant);
        Long ownerUserId = tenantOwnerProvisioningService.provisionOwner(
                savedTenant.getId(), request.ownerEmail(), request.ownerPassword());
        return new ApprovalResult(savedTenant.getId(), ownerUserId);
    }

    public record ApprovalResult(String tenantId, Long ownerUserId) {
    }
}
