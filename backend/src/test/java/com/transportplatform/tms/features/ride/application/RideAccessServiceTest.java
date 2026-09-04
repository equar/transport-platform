package com.transportplatform.tms.features.ride.application;

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
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import com.transportplatform.tms.features.ride.domain.RideRepository;

@ExtendWith(MockitoExtension.class)
class RideAccessServiceTest {

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private RideRepository rideRepository;

    @Mock
    private RecurringRideScheduleRepository recurringRideScheduleRepository;

    @Test
    void findRideForCompanyScopeRejectsCrossTenantResourceId() {
        RideAccessService service = new RideAccessService(
                currentAuthenticatedUserService,
                rideRepository,
                recurringRideScheduleRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin("tenant-a"));
        when(rideRepository.findByIdAndTenantId(77L, "tenant-a")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () -> service.findRideForCompanyScope(77L));

        assertEquals("RESOURCE_NOT_FOUND", exception.getErrorCode().name());
        verify(rideRepository).findByIdAndTenantId(77L, "tenant-a");
    }

    @Test
    void requireCompanyTenantIdRejectsUserWithoutTenantAdminRole() {
        RideAccessService service = new RideAccessService(
                currentAuthenticatedUserService,
                rideRepository,
                recurringRideScheduleRepository);
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(dispatcher("tenant-a"));

        ApiException exception = assertThrows(ApiException.class, service::requireCompanyTenantId);

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
