package com.transportplatform.tms.features.driverportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class DriverPortalAccessService {

    private final PortalAccessService portalAccessService;
    private final DriverRepository driverRepository;
    private final RideRepository rideRepository;
    private final RouteRepository routeRepository;

    public DriverPortalAccessService(PortalAccessService portalAccessService,
            DriverRepository driverRepository,
            RideRepository rideRepository,
            RouteRepository routeRepository) {
        this.portalAccessService = portalAccessService;
        this.driverRepository = driverRepository;
        this.rideRepository = rideRepository;
        this.routeRepository = routeRepository;
    }

    public Driver resolveCurrentDriver() {
        var scope = portalAccessService.requireCurrentScope(PortalAccessService.driverRoles(),
                java.util.Set.of(PortalSubjectType.DRIVER));
        return driverRepository.findByIdAndTenantId(scope.scope().getPortalSubjectId(), scope.user().tenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "The linked driver profile could not be found."));
    }

    public Ride requireAssignedRide(Long rideId) {
        Driver driver = resolveCurrentDriver();
        Ride ride = rideRepository.findByIdAndTenantId(rideId, driver.getTenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "The requested ride could not be found."));
        if (ride.getDriverId() == null || !ride.getDriverId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Drivers can only access rides assigned to their own profile.");
        }
        return ride;
    }

    public Route requireAssignedRoute(Long routeId) {
        Driver driver = resolveCurrentDriver();
        Route route = routeRepository.findByIdAndTenantId(routeId, driver.getTenantId())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "The requested route could not be found."));
        if (route.getAssignedDriverId() == null || !route.getAssignedDriverId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Drivers can only access routes assigned to their own profile.");
        }
        return route;
    }
}