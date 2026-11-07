package com.transportplatform.tms.features.driver.application;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.driver.domain.DriverRepository;

@ExtendWith(MockitoExtension.class)
class DriverAccessServiceTest {

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private DriverRepository driverRepository;

    @Test
    void findDriverForCompanyScopeRejectsCrossTenantResourceId() {
        DriverAccessService service = new DriverAccessService(currentAuthenticatedUserService, driverRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(dispatcher("tenant-a"));
        when(driverRepository.findByIdAndTenantId(99L, "tenant-a")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () -> service.findDriverForCompanyScope(99L));

        assertEquals("RESOURCE_NOT_FOUND", exception.getErrorCode().name());
        verify(driverRepository).findByIdAndTenantId(99L, "tenant-a");
    }

    @Test
    void requireCompanyTenantIdAcceptsDispatcherRole() {
        DriverAccessService service = new DriverAccessService(currentAuthenticatedUserService, driverRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(dispatcher("tenant-a"));

        String tenantId = service.requireCompanyTenantId();

        assertEquals("tenant-a", tenantId);
    }

    @Test
    void requireCompanyTenantIdRejectsUnsupportedRole() {
        DriverAccessService service = new DriverAccessService(currentAuthenticatedUserService, driverRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(guardian("tenant-a"));

        ApiException exception = assertThrows(ApiException.class, service::requireCompanyTenantId);

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    private AuthenticatedUser dispatcher(String tenantId) {
        return new AuthenticatedUser(
                2L,
                tenantId,
                "dispatcher@example.com",
                "Dispatch",
                "User",
                "secret",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_DISPATCHER.name())));
    }

    private AuthenticatedUser guardian(String tenantId) {
        return new AuthenticatedUser(
                3L,
                tenantId,
                "guardian@example.com",
                "Guard",
                "User",
                "secret",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_GUARDIAN.name())));
    }
}
