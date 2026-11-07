package com.transportplatform.tms.features.driverportal.api;
import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalVehicleResponse;
import com.transportplatform.tms.features.driverportal.application.DriverPortalVehicleService;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
@RestController
public class DriverPortalVehicleController {
    private final DriverPortalVehicleService service;
    public DriverPortalVehicleController(DriverPortalVehicleService service) { this.service=service; }
    @GetMapping("/portal/driver/vehicles")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<List<DriverPortalVehicleResponse>> list() { return ApiResponse.success(service.listMyVehicles()); }
}
