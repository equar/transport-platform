package com.transportplatform.tms.features.tenant.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.notification.application.NotificationTemplateProvisioningService;
import com.transportplatform.tms.features.tenant.api.request.TenantUpsertRequest;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationTemplateProvisioningService notificationTemplateProvisioningService;

    @Test
    void createProvisionsDefaultNotificationTemplates() {
        TenantMapper tenantMapper = new TenantMapper();
        TenantService tenantService = new TenantService(
                tenantRepository,
                tenantMapper,
                auditLogService,
                notificationTemplateProvisioningService);

        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        tenantService.create(new TenantUpsertRequest(
                "northwind",
                "Northwind Transport",
                "Northwind Transport LLC",
                "ops@northwind.example",
                "+1-555-0123",
                "1 Main Street",
                null,
                "Dallas",
                "TX",
                "75001",
                "USA",
                "Carrier",
                "Growth",
                Set.of("DISPATCH"),
                null));

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());
        verify(notificationTemplateProvisioningService).provisionDefaults(tenantCaptor.getValue().getId());
        org.junit.jupiter.api.Assertions.assertEquals(TenantStatus.PENDING, tenantCaptor.getValue().getStatus());
    }

    @Test
    void createFromApplicationProvisionsDefaultNotificationTemplates() {
        TenantMapper tenantMapper = new TenantMapper();
        TenantService tenantService = new TenantService(
                tenantRepository,
                tenantMapper,
                auditLogService,
                notificationTemplateProvisioningService);

        Tenant tenant = new Tenant();
        tenant.setId("tenant-123");
        tenant.setCompanyName("Northwind Transport");
        when(tenantRepository.save(tenant)).thenReturn(tenant);

        tenantService.createFromApplication(tenant);

        verify(notificationTemplateProvisioningService).provisionDefaults("tenant-123");
    }
}