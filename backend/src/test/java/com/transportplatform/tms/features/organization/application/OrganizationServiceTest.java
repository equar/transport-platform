package com.transportplatform.tms.features.organization.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.api.request.OrganizationUpsertRequest;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.saas.application.SubscriptionEnforcementService;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationContactRepository organizationContactRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private RiderRepository riderRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private OrganizationCodeGenerator organizationCodeGenerator;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private SubscriptionEnforcementService subscriptionEnforcementService;

    @Test
    void companyOrganizationCreationUsesTenantScopeAndPendingDefault() {
        OrganizationService organizationService = new OrganizationService(
                organizationRepository,
                organizationContactRepository,
                contractRepository,
                riderRepository,
                new OrganizationMapper(),
                new OrganizationContactMapper(),
                new ContractMapper(),
                organizationAccessService,
                organizationCodeGenerator,
                auditLogService,
                subscriptionEnforcementService);

        when(organizationAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(organizationCodeGenerator.generate("tenant-123")).thenReturn("ORG-000123");
        when(organizationRepository.save(any(Organization.class))).thenAnswer(invocation -> invocation.getArgument(0));

        organizationService.createCompanyOrganization(new OrganizationUpsertRequest(
                OrganizationType.CLINIC,
                "Mercy Clinic",
                "Mercy Clinic LLC",
                "123 Main Street",
                "Suite 100",
                "Austin",
                "TX",
                "78701",
                "United States",
                "456 Billing Avenue",
                null,
                "Dallas",
                "TX",
                "75001",
                "United States",
                "+1 (555) 121-1212",
                "ops@mercy.example",
                "https://mercy.example",
                "Enterprise healthcare partner"));

        ArgumentCaptor<Organization> organizationCaptor = ArgumentCaptor.forClass(Organization.class);
        verify(organizationRepository).save(organizationCaptor.capture());
        verify(subscriptionEnforcementService).requireOrganizationCreationAllowed("tenant-123");
        assertEquals("tenant-123", organizationCaptor.getValue().getTenantId());
        assertEquals("ORG-000123", organizationCaptor.getValue().getOrganizationCode());
        assertEquals(OrganizationStatus.PENDING, organizationCaptor.getValue().getStatus());
    }
}