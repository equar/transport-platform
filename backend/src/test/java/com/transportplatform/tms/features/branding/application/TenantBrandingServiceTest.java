package com.transportplatform.tms.features.branding.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.domain.*;
import com.transportplatform.tms.features.settings.application.CompanySettingsService;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class TenantBrandingServiceTest {
    final CurrentAuthenticatedUserService current = mock(CurrentAuthenticatedUserService.class);
    final TenantRepository tenants = mock(TenantRepository.class);
    final TenantSettingsRepository settings = mock(TenantSettingsRepository.class);
    final TenantTransportComplianceRepository compliance = mock(TenantTransportComplianceRepository.class);
    final AuditLogService audit = mock(AuditLogService.class);
    final TenantBrandingService service = new TenantBrandingService(current, tenants, settings, compliance, audit);
    Tenant tenant; TenantSettings row;
    void actor(String role, String tenantId) {
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(1L, tenantId, "admin@example.com", "Admin", "", "", true, true, false, List.of(new SimpleGrantedAuthority(role))));
    }
    @BeforeEach void setup() {
        actor("ROLE_TENANT_ADMIN", "tenant-a");
        tenant = new Tenant(); tenant.setId("tenant-a"); tenant.setCompanyName("Acme Transit"); tenant.setStatus(TenantStatus.ACTIVE);
        row = CompanySettingsService.defaultSettings("tenant-a"); row.setCompanyLogoUrl("https://example.com/logo.png");
        when(tenants.lockForDispatch("tenant-a")).thenReturn(Optional.of(tenant));
        when(tenants.findById("tenant-a")).thenReturn(Optional.of(tenant));
        when(settings.findById("tenant-a")).thenReturn(Optional.of(row));
        var profile = new TenantTransportCompliance(); profile.setVerificationStatus(TransportVerificationStatus.VERIFIED);
        when(compliance.findById("tenant-a")).thenReturn(Optional.of(profile));
    }
    @Test void verifiedTenantCanSelectAndResetWithoutLosingItsIdentity() {
        assertEquals("FOREST", service.apply("tenant-a", "FOREST").selectedCode());
        assertEquals("#276442", row.getPrimaryColor()); assertEquals("#173c2b", row.getSecondaryColor());
        assertEquals("https://example.com/logo.png", row.getCompanyLogoUrl());
        service.apply("tenant-a", "DEFAULT");
        assertNull(row.getPrimaryColor()); assertNull(row.getSecondaryColor()); assertNull(row.getAccentColor());
        assertEquals("https://example.com/logo.png", row.getCompanyLogoUrl());
        verify(audit, times(2)).record(any());
    }
    @Test void cannotTargetAnotherTenantOrMutateWithAPassengerRole() {
        assertThrows(ApiException.class, () -> service.apply("tenant-b", "FOREST"));
        actor("ROLE_RIDER", "tenant-a");
        assertThrows(ApiException.class, () -> service.apply("tenant-a", "FOREST"));
        verifyNoInteractions(audit); verify(settings, never()).save(any());
    }
    @Test void unverifiedOrInactiveTenantsCannotApplyThemes() {
        when(compliance.findById("tenant-a")).thenReturn(Optional.empty());
        assertFalse(service.get("tenant-a").eligible());
        assertThrows(ApiException.class, () -> service.apply("tenant-a", "FOREST"));
        tenant.setStatus(TenantStatus.SUSPENDED);
        assertThrows(ApiException.class, () -> service.apply("tenant-a", "FOREST"));
        verify(settings, never()).save(any());
    }
    @Test void catalogRejectsUnknownValuesAndPreservesLegacyColorsUntilSelection() {
        row.setPrimaryColor("#123456");
        assertEquals("CUSTOM", service.get("tenant-a").selectedCode());
        assertThrows(ApiException.class, () -> service.apply("tenant-a", "<script>"));
        assertEquals("#123456", row.getPrimaryColor());
        verify(settings, never()).save(any());
    }
    @Test void platformAdminCanApplyToASpecificVerifiedTenant() {
        actor("ROLE_PLATFORM_ADMIN", null);
        service.apply("tenant-a", "HARBOR");
        verify(settings).save(row); verify(settings, never()).findById("tenant-b");
    }
}
