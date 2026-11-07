package com.transportplatform.tms.features.tenant.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TenantResourceProvisioningServiceTest {

    @Mock
    private TenantSettingsRepository tenantSettingsRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @InjectMocks
    private TenantResourceProvisioningService service;

    @Test
    void initializeCreatesOperationalDefaultsOnce() {
        when(tenantSettingsRepository.existsById("tenant-1")).thenReturn(false);

        service.initialize("tenant-1");

        verify(tenantSettingsRepository).save(org.mockito.ArgumentMatchers.any(TenantSettings.class));
    }

    @Test
    void activationRequiresActiveTenantAdministrator() {
        when(appUserRepository.countByRoleAndTenantScopeAndStatus(
                RoleName.ROLE_TENANT_ADMIN, "tenant-1", UserStatus.ACTIVE)).thenReturn(0L);

        assertThrows(ApiException.class, () -> service.ensureReadyForActivation("tenant-1"));
    }

    @Test
    void activationInitializesResourcesWhenAdministratorExists() {
        when(appUserRepository.countByRoleAndTenantScopeAndStatus(
                RoleName.ROLE_TENANT_ADMIN, "tenant-1", UserStatus.ACTIVE)).thenReturn(1L);
        when(tenantSettingsRepository.existsById("tenant-1")).thenReturn(true);

        assertDoesNotThrow(() -> service.ensureReadyForActivation("tenant-1"));
    }
}
