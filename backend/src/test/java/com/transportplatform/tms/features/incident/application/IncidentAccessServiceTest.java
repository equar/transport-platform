package com.transportplatform.tms.features.incident.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.incident.domain.IncidentRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class IncidentAccessServiceTest {

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private IncidentRepository incidentRepository;

    @Test
    void findCompanyIncidentRejectsCrossTenantResourceId() {
        IncidentAccessService service = new IncidentAccessService(currentAuthenticatedUserService, incidentRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin("tenant-a"));
        when(incidentRepository.findByIdAndTenantId(55L, "tenant-a")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () -> service.findCompanyIncident(55L));

        assertEquals("RESOURCE_NOT_FOUND", exception.getErrorCode().name());
        verify(incidentRepository).findByIdAndTenantId(55L, "tenant-a");
    }

    @Test
    void requireCompanyAdminRejectsNonAdminRole() {
        IncidentAccessService service = new IncidentAccessService(currentAuthenticatedUserService, incidentRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(dispatcher("tenant-a"));

        ApiException exception = assertThrows(ApiException.class, service::requireCompanyAdmin);

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    private AuthenticatedUser companyAdmin(String tenantId) {
        return new AuthenticatedUser(
                1L,
                tenantId,
                "admin@example.com",
                "Admin",
                "User",
                "secret",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_TENANT_ADMIN.name())));
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
}
