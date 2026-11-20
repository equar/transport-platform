package com.transportplatform.tms.features.riderguardianportal.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.location.domain.*;
import com.transportplatform.tms.features.location.application.DriverLocationSnapshotMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PortalLocationHistoryTest {
    @Mock RiderGuardianPortalAccessService access;
    @Mock RideRepository rides;
    @Mock DriverLocationSnapshotRepository snapshots;
    @Mock DriverLocationSnapshotMapper mapper;
    @InjectMocks RiderGuardianPortalService portal;

    private Ride scope(PortalSubjectType type, RideStatus status) {
        Rider rider = new Rider(); ReflectionTestUtils.setField(rider, "id", 5L);
        Ride ride = new Ride(); ReflectionTestUtils.setField(ride, "id", 9L);
        ride.setTenantId("tenant"); ride.setRider(rider); ride.setDriverId(7L); ride.setStatus(status);
        var user = new AuthenticatedUser(1L, "tenant", "user@example.com", "User", "", "", true, true, false, List.of());
        when(access.resolveCurrentScope()).thenReturn(new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
            user, type, rider, null, List.of(), List.of(rider)));
        when(rides.findByIdAndTenantId(9L, "tenant")).thenReturn(Optional.of(ride));
        return ride;
    }
    @Test void guardianHistoryIsLimitedToTheRideTenantAndCurrentlyAssignedDriver() {
        scope(PortalSubjectType.GUARDIAN, RideStatus.PICKED_UP);
        when(snapshots.findTop1000ByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant", 9L, 7L)).thenReturn(List.of());
        assertTrue(portal.getRideLocationHistory(9L).isEmpty());
        verify(snapshots).findTop1000ByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant", 9L, 7L);
    }
    @Test void riderCannotReadAnotherRidersHistory() {
        Ride ride = scope(PortalSubjectType.RIDER, RideStatus.PICKED_UP);
        Rider other = new Rider(); ReflectionTestUtils.setField(other, "id", 6L); ride.setRider(other);
        assertThrows(ApiException.class, () -> portal.getRideLocationHistory(9L));
        verifyNoInteractions(snapshots);
    }
    @Test void completedTripDoesNotExposeLiveDriverHistory() {
        scope(PortalSubjectType.RIDER, RideStatus.COMPLETED);
        assertTrue(portal.getRideLocationHistory(9L).isEmpty());
        verifyNoInteractions(snapshots);
    }
    @Test void anotherTenantCannotReadHistory() {
        scope(PortalSubjectType.GUARDIAN, RideStatus.PICKED_UP);
        when(rides.findByIdAndTenantId(9L, "tenant")).thenReturn(Optional.empty());
        assertThrows(ApiException.class, () -> portal.getRideLocationHistory(9L));
        verifyNoInteractions(snapshots);
    }
}
