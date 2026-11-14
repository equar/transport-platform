package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.features.dispatch.application.PooledRideCapacity;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.dispatch.application.DispatchAssignmentValidationService;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
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
import com.transportplatform.tms.features.ride.application.RideStatusWorkflow;
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
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RouteService {

    private final TenantRepository dispatchTenants;
    private final DispatchAssignmentValidationService dispatchValidation;
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
    private final NotificationEventService notifications;

    public RouteService(TenantRepository dispatchTenants,
            DispatchAssignmentValidationService dispatchValidation,
            RouteRepository routeRepository,
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
            AuditLogService auditLogService,
            NotificationEventService notifications) {
        this.dispatchTenants=dispatchTenants;this.dispatchValidation=dispatchValidation;
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
        this.notifications = notifications;
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
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
        syncLinkedRideResourcesFromRoute(saved);
        recordRouteAudit(saved, "RESOURCES_ASSIGNED",
                "Route resources were assigned for route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse unassignCompanyRouteDriver(Long routeId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Object oldSnapshot = snapshot(route);
        route.setAssignedDriverId(null);
        Route saved = routeRepository.save(route);
        syncLinkedRideResourcesFromRoute(saved);
        recordRouteAudit(saved, "DRIVER_UNASSIGNED",
                "Driver assignment was removed from route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse unassignCompanyRouteVehicle(Long routeId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Object oldSnapshot = snapshot(route);
        route.setAssignedVehicleId(null);
        Route saved = routeRepository.save(route);
        syncLinkedRideResourcesFromRoute(saved);
        recordRouteAudit(saved, "VEHICLE_UNASSIGNED",
                "Vehicle assignment was removed from route " + saved.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(saved.getId());
    }

    @Transactional
    public RouteResponse markCompanyRouteReady(Long routeId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanStart(route.getStatus());
        if (route.getAssignedDriverId() == null || route.getAssignedVehicleId() == null) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "A route must have both driver and vehicle resources assigned before it can start.");
        }
        syncLinkedRideResourcesFromRoute(route);
        return updateRouteStatus(route, RouteStatus.IN_PROGRESS, "STARTED",
                "Route " + route.getRouteCode() + " was started.");
    }

    @Transactional
    public RouteResponse completeCompanyRoute(Long routeId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanComplete(route.getStatus());
        List<RouteStop> stops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(), route.getId());
        RouteStatusWorkflow.ensureRidesFinished(stops.stream()
                .map(stop -> stop.getRide().getStatus())
                .toList());
        return updateRouteStatus(route, RouteStatus.COMPLETED, "COMPLETED",
                "Route " + route.getRouteCode() + " was completed.");
    }

    @Transactional
    public RouteResponse cancelCompanyRoute(Long routeId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanCancel(route.getStatus());
        Object oldRouteSnapshot = snapshot(route);
        List<RouteStop> routeStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(), route.getId());
        for (RouteStop routeStop : routeStops) {
            Ride ride = routeStop.getRide();
            RideStatusWorkflow.ensureCanAssignResources(ride.getStatus());
        }
        for (RouteStop routeStop : routeStops) {
            Ride ride = routeStop.getRide();
            RideStatus previousStatus = ride.getStatus();
            if (ride.getDriverId() != null) {
                rideEventService.recordDriverUnassigned(ride, ride.getDriverId().toString(),
                        "Route " + route.getRouteCode() + " was cancelled.");
            }
            if (ride.getVehicleId() != null) {
                rideEventService.recordVehicleUnassigned(ride, ride.getVehicleId().toString(),
                        "Route " + route.getRouteCode() + " was cancelled.");
            }
            rideEventService.recordRouteUnassigned(ride, route.getRouteCode(), routeStop.getNotes());
            ride.setRouteId(null);
            ride.setDriverId(null);
            ride.setVehicleId(null);
            ride.setStatus(RideStatus.SCHEDULED);
            rideRepository.save(ride);
            if (previousStatus != ride.getStatus()) {
                notifications.publishRideStatusChanged(ride, previousStatus, ride.getStatus());
            }
            recordRouteStopAudit(routeStop, "STOP_REMOVED",
                    "Ride " + ride.getRideNumber() + " was released because route " + route.getRouteCode()
                            + " was cancelled.",
                    snapshot(routeStop),
                    null);
        }
        routeStopRepository.deleteAll(routeStops);
        routeStopRepository.flush();
        route.setAssignedDriverId(null);
        route.setAssignedVehicleId(null);
        route.setStatus(RouteStatus.CANCELLED);
        Route savedRoute = routeRepository.save(route);
        recordRouteAudit(savedRoute, "CANCELLED",
                "Route " + route.getRouteCode() + " was cancelled.",
                oldRouteSnapshot,
                snapshot(savedRoute));
        return getCompanyRoute(savedRoute.getId());
    }

    @Transactional
    public RouteResponse addRideToCompanyRoute(Long routeId, AddRouteStopRequest request) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        Ride ride = rideAccessService.findRideForCompanyScope(request.rideId());
        RideStatusWorkflow.ensureCanAssignResources(ride.getStatus());
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
        List<RouteStop> orderedStops = new ArrayList<>(existingStops);
        orderedStops.add(targetSequence - 1, routeStop);
        RouteStopSequence.persist(routeStopRepository, orderedStops);
        RouteStop savedStop = routeStop;

        ride.setRouteId(route.getId());
        applyRouteResourcesToRide(ride, route);
        rideEventService.recordRouteAssigned(ride, route.getRouteCode(), savedStop.getNotes());
        recordRouteStopAudit(savedStop, "STOP_ADDED",
                "Ride " + ride.getRideNumber() + " was added to route " + route.getRouteCode() + ".",
                null,
                snapshot(savedStop));
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse updateCompanyRouteStop(Long routeId, Long routeStopId, UpdateRouteStopRequest request) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
            existingStops.add(targetSequence - 1, routeStop);
            RouteStopSequence.persist(routeStopRepository, existingStops);
        }
        validateRouteStop(routeStop);
        RouteStop saved = routeStopRepository.save(routeStop);
        validateRouteCapacity(route);
        recordRouteStopAudit(saved, "STOP_UPDATED",
                "Route stop was updated for route " + route.getRouteCode() + ".",
                oldSnapshot,
                snapshot(saved));
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse removeRideFromCompanyRoute(Long routeId, Long routeStopId) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
        Route route = routeAccessService.findRouteForCompanyScope(routeId);
        RouteStatusWorkflow.ensureCanEdit(route.getStatus());
        RouteStop routeStop = routeAccessService.findRouteStopForCompanyScope(routeStopId);
        if (!routeStop.getRoute().getId().equals(route.getId())) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Route stop was not found.");
        }
        Ride ride = routeStop.getRide();
        RideStatusWorkflow.ensureCanAssignResources(ride.getStatus());
        routeStopRepository.delete(routeStop);
        routeStopRepository.flush();
        normalizeStopSequences(route.getTenantId(), route.getId());
        ride.setRouteId(null);
        RideStatus previousStatus = ride.getStatus();
        if (ride.getDriverId() != null) rideEventService.recordDriverUnassigned(ride, ride.getDriverId().toString(), "Removed from route.");
        if (ride.getVehicleId() != null) rideEventService.recordVehicleUnassigned(ride, ride.getVehicleId().toString(), "Removed from route.");
        ride.setDriverId(null);
        ride.setVehicleId(null);
        ride.setStatus(RideStatus.SCHEDULED);
        rideRepository.save(ride);
        if (previousStatus != ride.getStatus()) notifications.publishRideStatusChanged(ride, previousStatus, ride.getStatus());
        rideEventService.recordRouteUnassigned(ride, route.getRouteCode(), routeStop.getNotes());
        recordRouteStopAudit(routeStop, "STOP_REMOVED",
                "Ride " + ride.getRideNumber() + " was removed from route " + route.getRouteCode() + ".",
                snapshot(routeStop),
                null);
        return getCompanyRoute(route.getId());
    }

    @Transactional
    public RouteResponse reorderCompanyRouteStops(Long routeId, ReorderRouteStopsRequest request) {
        dispatchTenants.lockForDispatch(routeAccessService.requireCompanyTenantId()).orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Company not found."));
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
        Set<Long> requestedStopIds = new HashSet<>();
        if (request.items().stream().anyMatch(item -> !requestedStopIds.add(item.routeStopId()))) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Route stop order must include each stop exactly once.");
        }
        for (var item : request.items()) {
            if (!stopsById.containsKey(item.routeStopId())) {
                throw new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        HttpStatus.BAD_REQUEST,
                        "Route stop order contains an invalid stop reference.");
            }
        }
        if (request.items().stream().map(item -> item.stopSequence()).distinct().count() != request.items().size()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Route stop order must not contain duplicate sequence values.");
        }
        List<RouteStop> orderedStops = request.items().stream()
                .sorted(Comparator.comparingInt(item -> item.stopSequence()))
                .map(item -> stopsById.get(item.routeStopId()))
                .toList();
        RouteStopSequence.persist(routeStopRepository, orderedStops);
        validateRouteCapacity(route);
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

    private void validateRouteCapacity(Route route) {
        if (route.getAssignedVehicleId() == null) return;
        Vehicle vehicle = requireAssignableVehicle(route.getTenantId(), route.getAssignedVehicleId());
        var stops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(route.getTenantId(), route.getId());
        var planned = stops.stream().collect(Collectors.toMap(stop -> stop.getRide().getId(), stop -> stop, (a, b) -> a));
        PooledRideCapacity.validate(vehicle,
                stops.stream().map(RouteStop::getRide).toList(), planned);
    }

    private void syncLinkedRideResourcesFromRoute(Route route) {
        validateRouteCapacity(route);
        List<RouteStop> linkedStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(
                route.getTenantId(),
                route.getId());
        if (linkedStops.isEmpty()) {
            return;
        }
        linkedStops.stream()
                .map(RouteStop::getRide)
                .forEach(ride -> applyRouteResourcesToRide(ride, route));
    }

    private void applyRouteResourcesToRide(Ride ride, Route route) {
        boolean resourcesChanged = !java.util.Objects.equals(ride.getDriverId(), route.getAssignedDriverId())
                || !java.util.Objects.equals(ride.getVehicleId(), route.getAssignedVehicleId());
        if (resourcesChanged) RideStatusWorkflow.ensureCanEdit(ride.getStatus());
        if (route.getAssignedDriverId() != null) {
            dispatchValidation.requireAssignableDriver(ride.getTenantId(), ride, route.getAssignedDriverId());
        }
        if (route.getAssignedVehicleId() != null) {
            dispatchValidation.requireAssignableVehicle(ride.getTenantId(), ride, route.getAssignedVehicleId());
        }
        Long previousDriver = ride.getDriverId();
        Long previousVehicle = ride.getVehicleId();
        RideStatus previousStatus = ride.getStatus();
        ride.setRouteId(route.getId());
        ride.setDriverId(route.getAssignedDriverId());
        ride.setVehicleId(route.getAssignedVehicleId());
        if (ride.getStatus() == RideStatus.SCHEDULED || ride.getStatus() == RideStatus.ASSIGNED) {
            ride.setStatus(ride.getDriverId() == null ? RideStatus.SCHEDULED : RideStatus.ASSIGNED);
        }
        rideRepository.save(ride);
        if (!java.util.Objects.equals(previousDriver, ride.getDriverId())) {
            if (previousDriver != null) rideEventService.recordDriverUnassigned(ride, previousDriver.toString(), "Route resources changed.");
            if (ride.getDriverId() != null) rideEventService.recordDriverAssigned(ride, ride.getDriverId().toString(), "Route resources changed.");
        }
        if (!java.util.Objects.equals(previousVehicle, ride.getVehicleId())) {
            if (previousVehicle != null) rideEventService.recordVehicleUnassigned(ride, previousVehicle.toString(), "Route resources changed.");
            if (ride.getVehicleId() != null) rideEventService.recordVehicleAssigned(ride, ride.getVehicleId().toString(), "Route resources changed.");
        }
        if (previousStatus != ride.getStatus()) {
            rideEventService.recordStatusChanged(ride, previousStatus, ride.getStatus(), "Route resources changed.");
            notifications.publishRideStatusChanged(ride, previousStatus, ride.getStatus());
        }
        if (!java.util.Objects.equals(previousDriver, ride.getDriverId()) && ride.getDriverId() != null) {
            driversForNotification(ride);
        }
        if (!java.util.Objects.equals(previousVehicle, ride.getVehicleId()) && ride.getVehicleId() != null) {
            vehicleRepository.findByIdAndTenantId(ride.getVehicleId(), ride.getTenantId())
                    .ifPresent(vehicle -> notifications.publishRideVehicleAssigned(ride, vehicle));
        }
    }

    private void driversForNotification(Ride ride) {
        driverRepository.findByIdAndTenantId(ride.getDriverId(), ride.getTenantId())
                .ifPresent(driver -> notifications.publishRideDriverAssigned(ride, driver));
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

    private void normalizeStopSequences(String tenantId, Long routeId) {
        List<RouteStop> routeStops = routeStopRepository.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(tenantId,
                routeId);
        RouteStopSequence.persist(routeStopRepository, routeStops);
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
