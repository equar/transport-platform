package com.transportplatform.tms.features.dispatch.application;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.ride.application.*;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.vehicle.domain.*;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import java.time.Clock;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class DispatchReplacementTest {
    @Test void removingAnOptionalVehiclePreservesDriverAssignmentAndStaleChangesAreRejected() {
        var tenants=mock(TenantRepository.class);var rides=mock(RideRepository.class);var access=mock(RideAccessService.class);
        var validator=mock(DispatchAssignmentValidationService.class);
        var service=new DispatchService(tenants,mock(TenantSettingsRepository.class),Clock.systemUTC(),rides,
            mock(DriverLocationSnapshotRepository.class),mock(DriverRepository.class),mock(VehicleRepository.class),access,
            validator,mock(DispatchMapper.class),mock(RideEventService.class),mock(AuditLogService.class),mock(NotificationEventService.class));
        when(access.requireCompanyTenantId()).thenReturn("tenant-a");when(tenants.lockForDispatch("tenant-a")).thenReturn(Optional.of(new Tenant()));
        Ride ride=new Ride();ride.setTenantId("tenant-a");ride.setStatus(RideStatus.ASSIGNED);ride.setDriverId(12L);ride.setVehicleId(4L);
        // Audit snapshots require an identity; Mockito supplies it without reflection into JPA fields.
        Ride saved=spy(ride);when(saved.getId()).thenReturn(1L);when(access.findRideForCompanyScope(1L)).thenReturn(saved);
        service.replaceRideResources(1L,12L,null,0L);
        assertEquals(RideStatus.ASSIGNED,saved.getStatus());assertNull(saved.getVehicleId());
        assertThrows(ApiException.class,()->service.replaceRideResources(1L,99L,null,5L));
        assertEquals(12L,saved.getDriverId());
        verify(validator,never()).requireAssignableDriver("tenant-a",saved,99L);
    }
}
