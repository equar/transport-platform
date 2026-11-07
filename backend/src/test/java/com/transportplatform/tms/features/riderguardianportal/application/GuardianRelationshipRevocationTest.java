package com.transportplatform.tms.features.riderguardianportal.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.ride.domain.*;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GuardianRelationshipRevocationTest {
    @Mock RiderGuardianPortalAccessService access;
    @Mock RideRepository rides;
    @InjectMocks RiderGuardianPortalService portal;
    @Test void historicalGuardianAssignmentDoesNotGrantAccessAfterRelationshipRevocation() {
        Guardian guardian = new Guardian(); ReflectionTestUtils.setField(guardian, "id", 4L);
        Rider rider = new Rider(); ReflectionTestUtils.setField(rider, "id", 5L);
        Ride ride = new Ride(); ride.setTenantId("tenant"); ride.setGuardian(guardian); ride.setRider(rider);
        AuthenticatedUser user = new AuthenticatedUser(1L, "tenant", "guardian@example.com", "Guardian", "", "", true, true, false, List.of());
        when(access.resolveCurrentScope()).thenReturn(new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                user, PortalSubjectType.GUARDIAN, null, guardian, List.of(), List.of()));
        when(rides.findByIdAndTenantId(9L, "tenant")).thenReturn(Optional.of(ride));
        assertThrows(ApiException.class, () -> portal.getRide(9L));
        assertThrows(ApiException.class, () -> portal.getRideLocationSnapshot(9L));
    }
}
