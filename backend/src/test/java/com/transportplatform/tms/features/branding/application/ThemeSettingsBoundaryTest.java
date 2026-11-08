package com.transportplatform.tms.features.branding.application;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.settings.api.request.CompanySettingsUpdateRequest;
import com.transportplatform.tms.features.settings.application.CompanySettingsService;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
class ThemeSettingsBoundaryTest {
    @Test void generalSettingsCannotBypassThePresetAndVerificationWorkflow() {
        var current = mock(CurrentAuthenticatedUserService.class); var tenants = mock(TenantRepository.class);
        var settings = mock(TenantSettingsRepository.class);
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(1L, "tenant", "admin@example.com", "Admin", "", "", true, true, false,
                List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))));
        Tenant tenant = new Tenant(); tenant.setId("tenant");
        when(tenants.findById("tenant")).thenReturn(Optional.of(tenant)); when(tenants.lockForDispatch("tenant")).thenReturn(Optional.of(tenant));
        when(settings.findById("tenant")).thenReturn(Optional.of(CompanySettingsService.defaultSettings("tenant")));
        var request = mock(CompanySettingsUpdateRequest.class); when(request.primaryColor()).thenReturn("#276442");
        assertThrows(ApiException.class, () -> new CompanySettingsService(current, tenants, settings, mock(AuditLogService.class)).updateCompanySettings(request));
        verify(settings, never()).save(any()); verify(tenants, never()).save(any());
    }
}
