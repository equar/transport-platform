package com.transportplatform.tms.features.location.application;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository;
import com.transportplatform.tms.features.location.api.request.DriverLocationSnapshotRequest;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class LocationPrivacyBoundaryTest {
    @Test void noTrackingBeforeDepartureOrAfterPassengerDropoff() {
        var access = mock(DriverPortalAccessService.class); var snapshots = mock(DriverLocationSnapshotRepository.class);
        var service = new DriverLocationSnapshotService(access, mock(RideAccessService.class), snapshots, new DriverLocationSnapshotMapper(), Clock.systemUTC());
        Ride ride = new Ride(); when(access.requireAssignedRide(9L)).thenReturn(ride);
        for (RideStatus status : List.of(RideStatus.ASSIGNED, RideStatus.DROPPED_OFF, RideStatus.COMPLETED, RideStatus.CANCELLED)) {
            ride.setStatus(status);
            assertThrows(ApiException.class, () -> service.captureDriverRideSnapshot(9L, new DriverLocationSnapshotRequest(1D, 2D, null, null, null, null)));
        }
        verifyNoInteractions(snapshots);
    }
    @Test void driverHistoryUsesAssignedRideScopeAndCannotBeReadAfterDropoff() {
        var access = mock(DriverPortalAccessService.class);
        var snapshots = mock(DriverLocationSnapshotRepository.class);
        var service = new DriverLocationSnapshotService(access, mock(RideAccessService.class), snapshots, new DriverLocationSnapshotMapper(), Clock.systemUTC());
        Ride ride = new Ride(); org.springframework.test.util.ReflectionTestUtils.setField(ride, "id", 9L);
        ride.setTenantId("tenant-a"); ride.setDriverId(7L); ride.setStatus(RideStatus.PICKED_UP);
        when(access.requireAssignedRide(9L)).thenReturn(ride);
        when(snapshots.findTop1000ByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant-a", 9L, 7L)).thenReturn(List.of());
        assertTrue(service.getDriverRideHistory(9L).isEmpty());
        verify(snapshots).findTop1000ByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc("tenant-a", 9L, 7L);
        clearInvocations(snapshots);
        ride.setStatus(RideStatus.DROPPED_OFF);
        assertTrue(service.getDriverRideHistory(9L).isEmpty());
        verifyNoInteractions(snapshots);
    }
}
