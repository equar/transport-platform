package com.transportplatform.tms.features.vehicle.application;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.vehicle.domain.*;
import java.util.HashSet;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
@Component
public class VehicleOwnershipPolicy {
    private final DriverRepository drivers;
    public VehicleOwnershipPolicy(DriverRepository drivers) { this.drivers=drivers; }
    public void validate(Vehicle vehicle) {
        if (vehicle.getOwnershipType()==VehicleOwnershipType.DRIVER_OWNED && vehicle.getOwnerDriverId()==null)
            throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"Select the owning driver for a driver-owned vehicle.");
        if (vehicle.getOwnershipType()!=VehicleOwnershipType.DRIVER_OWNED && vehicle.getOwnerDriverId()!=null)
            throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"Only driver-owned vehicles can have a driver owner.");
        var links=new HashSet<Long>();
        if (vehicle.getOwnerDriverId()!=null) links.add(vehicle.getOwnerDriverId());
        if (vehicle.getAssignedDriverId()!=null) links.add(vehicle.getAssignedDriverId());
        for (Long id:links) if (drivers.findByIdAndTenantId(id,vehicle.getTenantId()).isEmpty())
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"A selected driver was not found in this workspace.");
    }
}
