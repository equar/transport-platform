package com.transportplatform.tms.features.riderguardianportal.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository;
import com.transportplatform.tms.features.location.application.DriverLocationSnapshotMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AssignedTripLocationTest {
    @Mock RiderGuardianPortalAccessService access;
    @Mock RideRepository rides;
    @Mock DriverLocationSnapshotRepository snapshots;
    @Mock DriverLocationSnapshotMapper mapper;
    @InjectMocks RiderGuardianPortalService portal;
    private Ride scopedRide(RideStatus status) {
        Rider rider = new Rider(); ReflectionTestUtils.setField(rider, "id", 5L);
        Ride ride = new Ride(); ride.setTenantId("tenant"); ride.setRider(rider); ride.setDriverId(8L); ride.setStatus(status);
        ReflectionTestUtils.setField(ride, "id", 9L);
        var user = new AuthenticatedUser(1L, "tenant", "rider@example.test", "Rider", "", "", true, true, false, List.of());
        when(access.resolveCurrentScope()).thenReturn(new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(user, PortalSubjectType.RIDER, rider, null, List.of(), List.of(rider)));
        when(rides.findByIdAndTenantId(9L, "tenant")).thenReturn(Optional.of(ride));
        return ride;
    }
    @Test void doesNotExposeHistoricalPositionsBeforeDepartureOrAfterDropoff() {
        Ride ride = scopedRide(RideStatus.ASSIGNED);
        for (RideStatus status : List.of(RideStatus.ASSIGNED, RideStatus.DROPPED_OFF, RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.FAILED)) {
            ride.setStatus(status);
            assertNull(portal.getRideLocationSnapshot(9L));
        }
        verifyNoInteractions(snapshots);
    }
    @Test void readsOnlyTheCurrentlyAssignedDriversPosition() {
        scopedRide(RideStatus.PICKED_UP);
        when(snapshots.findTopByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant", 9L, 8L)).thenReturn(Optional.empty());
        assertNull(portal.getRideLocationSnapshot(9L));
        verify(snapshots).findTopByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant", 9L, 8L);
        verify(snapshots, never()).findTopByTenantIdAndRide_IdOrderByCapturedAtDescIdDesc(any(), any());
    }
}
