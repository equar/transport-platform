package com.transportplatform.tms.features.driverportal.application;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalVehicleResponse;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class DriverPortalVehicleService {
    private final DriverPortalAccessService access;
    private final VehicleRepository vehicles;
    public DriverPortalVehicleService(DriverPortalAccessService access,VehicleRepository vehicles) { this.access=access; this.vehicles=vehicles; }
    @Transactional(readOnly=true)
    public List<DriverPortalVehicleResponse> listMyVehicles() {
        var driver=access.resolveCurrentDriver();
        return vehicles.findAllForDriver(driver.getTenantId(),driver.getId()).stream().map(v ->
            new DriverPortalVehicleResponse(v.getId(),v.getVehicleCode(),v.getOwnershipType(),
                driver.getId().equals(v.getOwnerDriverId()),driver.getId().equals(v.getAssignedDriverId()),
                v.getMake(),v.getModel(),v.getYear(),v.getColor(),v.getPlateNumber(),v.getPlateState(),
                v.getCapacity(),v.getWheelchairCapacity(),v.getFuelType(),v.getStatus(),v.getInsuranceExpiryDate(),
                v.getRegistrationExpiryDate(),v.getInspectionExpiryDate())).toList();
    }
}
