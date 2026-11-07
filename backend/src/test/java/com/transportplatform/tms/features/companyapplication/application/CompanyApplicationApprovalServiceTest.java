package com.transportplatform.tms.features.companyapplication.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationReviewRequest;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.tenant.application.TenantService;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CompanyApplicationApprovalServiceTest {

    @Mock
    private TenantService tenantService;

    @Mock
    private TenantCodeGenerator tenantCodeGenerator;

    @Mock
    private TenantOwnerProvisioningService tenantOwnerProvisioningService;

    @InjectMocks
    private CompanyApplicationApprovalService companyApplicationApprovalService;

    @Test
    void approveCreatesTenantAndOwnerProvisioning() {
        CompanyApplication application = new CompanyApplication();
        application.setLegalCompanyName("Northwind Transport");
        application.setDbaName("Northwind");
        application.setEmail("owner@northwind.example");
        application.setPhone("+1-555-0123");
        application.setAddressLine1("1 Main St");
        application.setCity("Dallas");
        application.setState("TX");
        application.setZipCode("75001");
        application.setCountry("USA");
        application.setBusinessType("Carrier");
        application.getRequestedServiceTypes().add("DISPATCH");

        CompanyApplicationReviewRequest request = new CompanyApplicationReviewRequest(
                "Approved",
                null,
                "GROWTH",
                "NORTHWIND",
                "owner@northwind.example",
                "Temporary123!");

        Tenant tenant = new Tenant();
        tenant.setId("tenant-1");

        when(tenantCodeGenerator.generate("Northwind Transport", "NORTHWIND")).thenReturn("NORTHWIND");
        when(tenantService.createFromApplication(any(Tenant.class))).thenReturn(tenant);
        when(tenantOwnerProvisioningService.provisionOwner(
                "tenant-1", "owner@northwind.example", "Temporary123!")).thenReturn(10L);

        CompanyApplicationApprovalService.ApprovalResult result = companyApplicationApprovalService.approve(application,
                request);

        assertEquals("tenant-1", result.tenantId());
        assertEquals(10L, result.ownerUserId());
    }
}
