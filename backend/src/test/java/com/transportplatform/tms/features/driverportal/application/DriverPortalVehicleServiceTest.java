package com.transportplatform.tms.features.driverportal.application;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.vehicle.domain.*;
import java.util.List;
import org.junit.jupiter.api.Test;
class DriverPortalVehicleServiceTest {
    @Test void resolvesTheAuthenticatedDriverAndDistinguishesOwnershipFromAssignment() {
        var access=mock(DriverPortalAccessService.class);var repo=mock(VehicleRepository.class);var driver=mock(Driver.class);
        when(access.resolveCurrentDriver()).thenReturn(driver);when(driver.getTenantId()).thenReturn("tenant-a");when(driver.getId()).thenReturn(7L);
        var owned=new Vehicle();owned.setOwnerDriverId(7L);owned.setAssignedDriverId(8L);
        var assigned=new Vehicle();assigned.setAssignedDriverId(7L);assigned.setOwnershipType(VehicleOwnershipType.COMPANY_OWNED);
        when(repo.findAllForDriver("tenant-a",7L)).thenReturn(List.of(owned,assigned));
        var result=new DriverPortalVehicleService(access,repo).listMyVehicles();
        assertThat(result.get(0).ownedByCurrentDriver()).isTrue();assertThat(result.get(0).assignedToCurrentDriver()).isFalse();
        assertThat(result.get(1).ownedByCurrentDriver()).isFalse();assertThat(result.get(1).assignedToCurrentDriver()).isTrue();
        verify(repo).findAllForDriver("tenant-a",7L);verifyNoMoreInteractions(repo);
    }
}
