package com.transportplatform.tms.features.vehicle.application;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.vehicle.domain.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
class VehicleOwnershipPolicyTest {
    final DriverRepository drivers=mock(DriverRepository.class);
    final VehicleOwnershipPolicy policy=new VehicleOwnershipPolicy(drivers);
    Vehicle vehicle(VehicleOwnershipType type,Long owner,Long assigned) { var v=new Vehicle();v.setTenantId("tenant-a");v.setOwnershipType(type);v.setOwnerDriverId(owner);v.setAssignedDriverId(assigned);return v; }
    @Test void companyVehicleDoesNotRequireDriverOwnership() { policy.validate(vehicle(VehicleOwnershipType.COMPANY_OWNED,null,null));verifyNoInteractions(drivers); }
    @Test void driverOwnedVehicleRequiresAnExplicitOwner() { assertThatThrownBy(()->policy.validate(vehicle(VehicleOwnershipType.DRIVER_OWNED,null,7L))).isInstanceOf(ApiException.class); }
    @Test void ownerAndOperatingAssignmentAreIndependent() {
        when(drivers.findByIdAndTenantId(7L,"tenant-a")).thenReturn(Optional.of(new Driver()));
        when(drivers.findByIdAndTenantId(8L,"tenant-a")).thenReturn(Optional.of(new Driver()));
        var v=vehicle(VehicleOwnershipType.DRIVER_OWNED,7L,8L);policy.validate(v);
        assertThat(v.getOwnerDriverId()).isEqualTo(7L);assertThat(v.getAssignedDriverId()).isEqualTo(8L);
    }
    @Test void foreignOwnerIsNotAccepted() { assertThatThrownBy(()->policy.validate(vehicle(VehicleOwnershipType.DRIVER_OWNED,7L,null))).isInstanceOf(ApiException.class);verify(drivers).findByIdAndTenantId(7L,"tenant-a"); }
    @Test void foreignOperatingDriverIsNotAcceptedEither() { assertThatThrownBy(()->policy.validate(vehicle(VehicleOwnershipType.COMPANY_OWNED,null,8L))).isInstanceOf(ApiException.class);verify(drivers).findByIdAndTenantId(8L,"tenant-a"); }
    @Test void companyOrLeasedVehicleCannotCarryDriverOwnership() { for(var type:java.util.List.of(VehicleOwnershipType.COMPANY_OWNED,VehicleOwnershipType.LEASED))assertThatThrownBy(()->policy.validate(vehicle(type,7L,null))).isInstanceOf(ApiException.class);verifyNoInteractions(drivers); }
}
