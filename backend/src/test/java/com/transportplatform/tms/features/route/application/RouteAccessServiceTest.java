package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class RouteAccessServiceTest {

    private final CurrentAuthenticatedUserService currentUser = mock(CurrentAuthenticatedUserService.class);
    private final RouteAccessService service = new RouteAccessService(
            currentUser, mock(RouteRepository.class), mock(RouteStopRepository.class));

    @Test
    void dispatcherCanManageRoutesInTheirTenant() {
        AuthenticatedUser dispatcher = user("tenant-a", RoleName.ROLE_DISPATCHER);
        when(currentUser.requireCurrentUser()).thenReturn(dispatcher);

        assertSame(dispatcher, service.requireCompanyUser());
        org.junit.jupiter.api.Assertions.assertEquals("tenant-a", service.requireCompanyTenantId());
    }

    @Test
    void dispatcherWithoutTenantIsDenied() {
        when(currentUser.requireCurrentUser()).thenReturn(user(null, RoleName.ROLE_DISPATCHER));

        assertThrows(ApiException.class, service::requireCompanyUser);
    }

    @Test
    void unrelatedRoleIsDenied() {
        when(currentUser.requireCurrentUser()).thenReturn(user("tenant-a", RoleName.ROLE_BILLING_ADMIN));

        assertThrows(ApiException.class, service::requireCompanyUser);
    }

    private AuthenticatedUser user(String tenantId, RoleName role) {
        return new AuthenticatedUser(1L, tenantId, "user@example.com", "User", "Name", "",
                true, true, false, List.of(new SimpleGrantedAuthority(role.name())));
    }
}
