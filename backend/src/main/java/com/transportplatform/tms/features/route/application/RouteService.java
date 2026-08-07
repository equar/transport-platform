package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import com.transportplatform.tms.features.route.api.request.AddRouteStopRequest;
import com.transportplatform.tms.features.route.api.request.AssignRouteResourcesRequest;
import com.transportplatform.tms.features.route.api.request.ReorderRouteStopsRequest;
import com.transportplatform.tms.features.route.api.request.RouteUpsertRequest;
import com.transportplatform.tms.features.route.api.request.UpdateRouteStopRequest;
import com.transportplatform.tms.features.route.api.response.RouteResponse;
import com.transportplatform.tms.features.route.api.response.RouteSummaryResponse;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import com.transportplatform.tms.features.route.domain.RouteStopStatus;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RouteService {

    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteAccessService routeAccessService;
    private final RideAccessService rideAccessService;
    private final RouteMapper routeMapper;
    private final RouteCodeGenerator routeCodeGenerator;
    private final DriverComplianceSummaryService driverComplianceSummaryService;
    private final VehicleComplianceSummaryService vehicleComplianceSummaryService;
    private final RideEventService rideEventService;
    private final AuditLogService auditLogService;

    public RouteService(RouteRepository routeRepository,
            RouteStopRepository routeStopRepository,
            RideRepository rideRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            RouteAccessService routeAccessService,
            RideAccessService rideAccessService,
            RouteMapper routeMapper,
            RouteCodeGenerator routeCodeGenerator,
            DriverComplianceSummaryService driverComplianceSummaryService,
            VehicleComplianceSummaryService vehicleComplianceSummaryService,
            RideEventService rideEventService,
            AuditLogService auditLogService) {
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.routeAccessService = routeAccessService;
        this.rideAccessService = rideAccessService;
        this.routeMapper = routeMapper;
        this.routeCodeGenerator = routeCodeGenerator;
        this.driverComplianceSummaryService = driverComplianceSummaryService;
        this.vehicleComplianceSummaryService = vehicleComplianceSummaryService;
        this.rideEventService = rideEventService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<RouteSummaryResponse> searchCompanyRoutes(String keyword,
            RouteStatus status,
            ServiceType serviceType,
            LocalDate fromDate,
            LocalDate toDate,
            Long driverId,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = routeAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = routeRepository.findAll(
                RouteSpecifications.search(tenantId, keyword, status, serviceType, fromDate, toDate, driverId),
                pageable);
        Map<Long, Driver> driversById = loadDriversById(tenantId, result.getContent());
        Map<Long, Vehicle> vehiclesById = loadVehiclesById(tenantId, result.getContent());
        Map<Long, Long> stopCounts = loadStopCounts(tenantId, result.getContent());
        return PageResponse.from(result.map(route -> routeMapper.toSummaryResponse(
                route,
                route.getAssignedDriverId() == null ? null : driversById.get(route.getAssignedDriverId()),
                route.getAssignedVehicleId() == null ? null : vehiclesById.get(route.getAssignedVehicleId()),
                stopCounts.getOrDefault(route.getId(), 0L))));
    }

    @Transactional(readOnly = true)
    public RouteResponse getCompanyRoute(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        List<RouteStop> stops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(),
                route.getId());
        return routeMapper.toResponse(
                route,
                route.getAssignedDriverId() == null ? null
                        : driverRepository.findByIdAndTenantId(route.getAssignedDriverId(), route.getTenantId())
                                .orElse(null),
                route.getAssignedVehicleId() == null ? null
                        : vehicleRepository.findByIdAndTenantId(route.getAssignedVehicleId(), route.getTenantId())
                                .orElse(null),
                stops.size(),
                stops.stream().map(routeMapper::toStopResponse).toList());
    }

    @Transactional
    public RouteResponse createCompanyRoute(RouteUpsertRequest request) {
        String tenantId = routeAccessService.requireCompanyTenantId();
        Route route = new Route();
        route.setTenantId(tenantId);
        route.setRouteCode(routeCodeGenerator.generate(tenantId));
        route.setStatus(RouteStatusWorkflow.resolveInitialStatus(request.status()));
        routeMapper.apply(route, request);
        validateRoute(route);
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, "CREATED", "Route " + saved.getRouteCode() + " was created.", null,
                snapshot(saved));
        return routeMapper.toResponse(saved, null, null, 0, List.of());
    }

    @Transactional
    public RouteResponse updateCompanyRoute(Long routeId, RouteUpsertRequest request) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Object oldSnapshot = snapshot(route);
        routeMapper.apply(route, request);
        validateRoute(route);
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, "UPDATED", "Route " + saved.getRouteCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse assignCompanyRouteResources(Long routeId, AssignRouteResourcesRequest request) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        if (request.driverId() == null && request.vehicleId() == null) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "At least one route resource must be provided.");
        }
        Object oldSnapshot = snapshot(route);
        if (request.driverId() != null) {
            Driver driver = requireAssignableDriver(route.getTenantId(), request.driverId());
            route.setAssignedDriverId(driver.getId());
        }
        if (request.vehicleId() != null) {
            Vehicle vehicle = requireAssignableVehicle(route.getTenantId(), request.vehicleId());
            route.setAssignedVehicleId(vehicle.getId());
        }
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, "RESOURCES_ASSIGNED",
                "Route resources were assigned for route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse unassignCompanyRouteDriver(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Object oldSnapshot = snapshot(route);
        route.setAssignedDriverId(null);
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, "DRIVER_UNASSIGNED",
                "Driver assignment was removed from route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse unassignCompanyRouteVehicle(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Object oldSnapshot = snapshot(route);
        route.setAssignedVehicleId(null);
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, "VEHICLE_UNASSIGNED",
                "Vehicle assignment was removed from route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse markCompanyRouteReady(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanMarkReady(route.getStatus());
        if (routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(route.getTenantId(), route.getId())
                .isEmpty()) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "A route must include at least one linked ride before it can be marked ready.");
        }
        return updateRouteStatus(route, RouteStatus.READY, "READY",
                "Route " + route.getRouteCode() + " was marked ready.");
    }

    @Transactional
    public RouteResponse startCompanyRoute(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanStart(route.getStatus());
        if (route.getAssignedDriverId() == null || route.getAssignedVehicleId() == null) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "A route must have both driver and vehicle resources assigned before it can start.");
        }
        return updateRouteStatus(route, RouteStatus.IN_PROGRESS, "STARTED",
                "Route " + route.getRouteCode() + " was started.");
    }

    @Transactional
    public RouteResponse completeCompanyRoute(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanComplete(route.getStatus());
        return updateRouteStatus(route, RouteStatus.COMPLETED, "COMPLETED",
                "Route " + route.getRouteCode() + " was completed.");
    }

    @Transactional
    public RouteResponse cancelCompanyRoute(Long routeId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanCancel(route.getStatus());
        return updateRouteStatus(route, RouteStatus.CANCELLED, "CANCELLED",
                "Route " + route.getRouteCode() + " was cancelled.");
    }

    @Transactional
    public RouteResponse addRideToCompanyRoute(Long routeId, AddRouteStopRequest request) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Ride ride = rideAccessService.findRideForCompanyScope(request.rideId());
        if (ride.getStatus() == RideStatus.CANCELLED || ride.getStatus() == RideStatus.COMPLETED) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Cancelled or completed rides cannot be linked to routes.");
        }
        if (routeStopRepository.existsByTenantIdAndRide_Id(route.getTenantId(), ride.getId())) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "This ride is already linked to a route.");
        }

        List<RouteStop> existingStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(),
                route.getId());
        int targetSequence = resolveTargetSequence(existingStops, request.stopSequence());
        shiftStopsForInsertion(existingStops, targetSequence);

        RouteStop routeStop = new RouteStop();
        routeStop.setTenantId(route.getTenantId());
        routeStop.setRoute(route);
        routeStop.setRide(ride);
        routeStop.setStopSequence(targetSequence);
        routeStop.setPlannedPickupAt(request.plannedPickupAt());
        routeStop.setPlannedDropoffAt(request.plannedDropoffAt());
        routeStop.setNotes(trimToNull(request.notes()));
        routeStop.setStatus(RouteStopStatus.PLANNED);
        validateRouteStop(routeStop);
        routeStopRepository.saveAll(existingStops);
        RouteStop savedStop = routeStopRepository.save(routeStop);

        ride.setRouteId(route.getId());
        rideRepository.save(ride);
        rideEventService.recordRouteAssigned(ride, route.getRouteCode(), savedStop.getNotes());
        recordRouteStopAudit(savedStop, "STOP_ADDED",
                "Ride " + ride.getRideNumber() + " was added to route " + route.getRouteCode() + ".",
                null,
                snapshot(savedStop));
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse updateCompanyRouteStop(Long routeId, Long routeStopId, UpdateRouteStopRequest request) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        RouteStop routeStop = routeAccessService.findRouteStopForCompanyScope(routeStopId);
        if (!routeStop.getRoute().getId().equals(route.getId())) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Route stop was not found.");
        }
        Object oldSnapshot = snapshot(routeStop);
        routeStop.setPlannedPickupAt(request.plannedPickupAt());
        routeStop.setPlannedDropoffAt(request.plannedDropoffAt());
        routeStop.setNotes(trimToNull(request.notes()));
        if (request.stopSequence() != null && request.stopSequence() != routeStop.getStopSequence()) {
            List<RouteStop> existingStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                    route.getTenantId(),
                    route.getId());
            existingStops.removeIf(stop -> stop.getId().equals(routeStop.getId()));
            int targetSequence = resolveTargetSequence(existingStops, request.stopSequence());
            shiftStopsForInsertion(existingStops, targetSequence);
            routeStop.setStopSequence(targetSequence);
            routeStopRepository.saveAll(existingStops);
        }
        validateRouteStop(routeStop);
        RouteStop saved = routeStopRepository.save(routeStop);
        recordRouteStopAudit(saved, "STOP_UPDATED",
                "Route stop was updated for route " + route.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse removeRideFromCompanyRoute(Long routeId, Long routeStopId) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        RouteStop routeStop = routeAccessService.findRouteStopForCompanyScope(routeStopId);
        if (!routeStop.getRoute().getId().equals(route.getId())) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Route stop was not found.");
        }
        Ride ride = routeStop.getRide();
        routeStopRepository.delete(routeStop);
        normalizeStopSequences(route.getTenantId(), route.getId());
        ride.setRouteId(null);
        rideRepository.save(ride);
        rideEventService.recordRouteUnassigned(ride, route.getRouteCode(), routeStop.getNotes());
        recordRouteStopAudit(routeStop, "STOP_REMOVED",
                "Ride " + ride.getRideNumber() + " was removed from route " + route.getRouteCode() + ".",
                snapshot(routeStop),
                null);
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse reorderCompanyRouteStops(Long routeId, ReorderRouteStopsRequest request) {
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        List<RouteStop> currentStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(), route.getId());
        Map<Long, RouteStop> stopsById = currentStops.stream()
                .collect(Collectors.toMap(RouteStop::getId, stop -> stop, (left, right) -> left, LinkedHashMap::new));
        if (request.items().size() != currentStops.size()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "All existing route stops must be included when reordering a route.");
        }
        for (var item : request.items()) {
            RouteStop routeStop = stopsById.get(item.routeStopId());
            if (routeStop == null) {
                throw new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        HttpStatus.BAD_REQUEST,
                        "Route stop order contains an invalid stop reference.");
            }
            routeStop.setStopSequence(item.stopSequence());
        }
        if (request.items().stream().map(item -> item.stopSequence()).distinct().count() != request.items().size()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Route stop order must not contain duplicate sequence values.");
        }
        routeStopRepository.saveAll(currentStops);
        normalizeStopSequences(route.getTenantId(), route.getId());
        recordRouteAudit(route, "STOPS_REORDERED", "Route stops were reordered for route " + route.getRouteCode() + ".",
                null, Map.of("stopCount", currentStops.size()));
        return getCompanyRoute(route.getId());
    }

    private RouteResponse updateRouteStatus(Route route, RouteStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(route);
        route.setStatus(status);
        Route saved = routeRepository.save(route);
        recordRouteAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    private Driver requireAssignableDriver(String tenantId, Long driverId) {
        Driver driver = driverRepository.findByIdAndTenantId(driverId, tenantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Driver was not found."));
        if (driver.getStatus() != DriverStatus.ACTIVE) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Only active drivers can be assigned to routes.");
        }
        if (driverComplianceSummaryService.getSummary(tenantId, driver)
                .overallStatus() != DriverComplianceStatus.COMPLIANT) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Only compliant drivers can be assigned to routes.");
        }
        return driver;
    }

    private Vehicle requireAssignableVehicle(String tenantId, Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Vehicle was not found."));
        if (vehicle.getStatus() != VehicleStatus.ACTIVE) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Only active vehicles can be assigned to routes.");
        }
        if (vehicleComplianceSummaryService.getSummary(tenantId, vehicle)
                .overallStatus() != VehicleComplianceStatus.COMPLIANT) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Only compliant vehicles can be assigned to routes.");
        }
        return vehicle;
    }

    private void validateRoute(Route route) {
        if (route.getEndTime() != null && route.getStartTime() != null
                && route.getEndTime().isBefore(route.getStartTime())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Route end time cannot be earlier than the route start time.");
        }
    }

    private void validateRouteStop(RouteStop routeStop) {
        if (routeStop.getPlannedPickupAt() != null && routeStop.getPlannedDropoffAt() != null
                && routeStop.getPlannedDropoffAt().isBefore(routeStop.getPlannedPickupAt())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Planned dropoff time cannot be earlier than planned pickup time.");
        }
    }

    private int resolveTargetSequence(List<RouteStop> existingStops, Integer requestedSequence) {
        if (requestedSequence == null || requestedSequence <= 0 || requestedSequence > existingStops.size() + 1) {
            return existingStops.size() + 1;
        }
        return requestedSequence;
    }

    private void shiftStopsForInsertion(List<RouteStop> existingStops, int targetSequence) {
        for (RouteStop existingStop : existingStops) {
            if (existingStop.getStopSequence() >= targetSequence) {
                existingStop.setStopSequence(existingStop.getStopSequence() + 1);
            }
        }
    }

    private void normalizeStopSequences(String tenantId, Long routeId) {
        List<RouteStop> routeStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(tenantId,
                routeId);
        for (int index = 0; index < routeStops.size(); index++) {
            routeStops.get(index).setStopSequence(index + 1);
        }
        routeStopRepository.saveAll(routeStops);
    }

    private Map<Long, Driver> loadDriversById(String tenantId, Collection<Route> routes) {
        List<Long> driverIds = routes.stream()
                .map(Route::getAssignedDriverId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (driverIds.isEmpty()) {
            return Map.of();
        }
        return driverRepository.findAllByTenantIdAndIdIn(tenantId, driverIds).stream()
                .collect(Collectors.toMap(Driver::getId, driver -> driver));
    }

    private Map<Long, Vehicle> loadVehiclesById(String tenantId, Collection<Route> routes) {
        List<Long> vehicleIds = routes.stream()
                .map(Route::getAssignedVehicleId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (vehicleIds.isEmpty()) {
            return Map.of();
        }
        return vehicleRepository.findAllByTenantIdAndIdIn(tenantId, vehicleIds).stream()
                .collect(Collectors.toMap(Vehicle::getId, vehicle -> vehicle));
    }

    private Map<Long, Long> loadStopCounts(String tenantId, Collection<Route> routes) {
        if (routes.isEmpty()) {
            return Map.of();
        }
        return routeStopRepository.findAllByTenantIdAndRoute_IdInOrderByStopSequenceAsc(tenantId,
                routes.stream().map(Route::getId).toList()).stream()
                .collect(Collectors.groupingBy(stop -> stop.getRoute().getId(), Collectors.counting()));
    }

    private void recordRouteAudit(Route route, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                route.getTenantId(),
                "ROUTE",
                action,
                "ROUTE",
                route.getId() == null ? route.getRouteCode() : route.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private void recordRouteStopAudit(RouteStop routeStop, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                routeStop.getTenantId(),
                "ROUTE_STOP",
                action,
                "ROUTE_STOP",
                routeStop.getId() == null
                        ? routeStop.getRoute().getId() + ":" + routeStop.getRide().getId()
                        : routeStop.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(Route route) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", route.getId());
        values.put("routeCode", route.getRouteCode());
        values.put("routeName", route.getRouteName());
        values.put("routeDate", route.getRouteDate());
        values.put("serviceType", route.getServiceType() == null ? null : route.getServiceType().name());
        values.put("assignedDriverId", route.getAssignedDriverId());
        values.put("assignedVehicleId", route.getAssignedVehicleId());
        values.put("startTime", route.getStartTime());
        values.put("endTime", route.getEndTime());
        values.put("status", route.getStatus() == null ? null : route.getStatus().name());
        return values;
    }

    private Object snapshot(RouteStop routeStop) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", routeStop.getId());
        values.put("routeId", routeStop.getRoute().getId());
        values.put("rideId", routeStop.getRide().getId());
        values.put("stopSequence", routeStop.getStopSequence());
        values.put("plannedPickupAt", routeStop.getPlannedPickupAt());
        values.put("plannedDropoffAt", routeStop.getPlannedDropoffAt());
        values.put("status", routeStop.getStatus() == null ? null : routeStop.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "routeDate" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "routeCode", "routeName", "routeDate", "status" -> resolved;
            default -> "routeDate";
        };
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}