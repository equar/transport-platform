package com.transportplatform.tms.features.rider.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.application.OrganizationValidationService;
import com.transportplatform.tms.features.rider.api.request.RiderUpsertRequest;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RiderServiceTest {

    @Mock
    private RiderRepository riderRepository;

    @Mock
    private RiderGuardianRepository riderGuardianRepository;

    @Mock
    private RiderAccessService riderAccessService;

    @Mock
    private RiderCodeGenerator riderCodeGenerator;

    @Mock
    private OrganizationValidationService organizationValidationService;

    @Mock
    private AuditLogService auditLogService;

    @Test
    void companyRiderCreationUsesTenantScopeAndPendingDefault() {
        RiderService riderService = new RiderService(
                riderRepository,
                riderGuardianRepository,
                new RiderMapper(),
                new RiderGuardianMapper(),
                riderAccessService,
                riderCodeGenerator,
                organizationValidationService,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        when(riderAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(riderCodeGenerator.generate("tenant-123")).thenReturn("RID-000123");
        when(riderRepository.save(any(Rider.class))).thenAnswer(invocation -> invocation.getArgument(0));

        riderService.createCompanyRider(new RiderUpsertRequest(
                RiderType.STUDENT,
                "Taylor",
                null,
                "Jordan",
                null,
                null,
                "taylor@example.com",
                "555 111 2222",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                Set.of(),
                false,
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null));

        ArgumentCaptor<Rider> riderCaptor = ArgumentCaptor.forClass(Rider.class);
        verify(riderRepository).save(riderCaptor.capture());
        assertEquals("tenant-123", riderCaptor.getValue().getTenantId());
        assertEquals("RID-000123", riderCaptor.getValue().getRiderCode());
        assertEquals(RiderStatus.PENDING, riderCaptor.getValue().getStatus());
    }
}