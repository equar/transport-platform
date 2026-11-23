package com.transportplatform.tms.features.dispatch.application;

import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import com.transportplatform.tms.features.compliance.application.TenantTransportComplianceService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class DispatchAssignmentValidationService {

    @org.springframework.beans.factory.annotation.Value("${app.dispatch.turnaround-minutes:15}")
    private long turnaroundMinutes = 15;
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate jdbc;
    @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.common.privacy.PhiCipher privacy;
    @org.springframework.beans.factory.annotation.Value("${app.dispatch.transfer-average-mph:25}")
    private double transferAverageMph = 25;

    private static final EnumSet<RideStatus> ACTIVE_ASSIGNMENT_STATUSES = EnumSet.of(
            RideStatus.SCHEDULED,
            RideStatus.ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP,
            RideStatus.DROPPED_OFF);

    private final RideRepository rideRepository;
    private final RouteStopRepository routeStops;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverComplianceSummaryService driverComplianceSummaryService;
    private final VehicleComplianceSummaryService vehicleComplianceSummaryService;
    private final TenantTransportComplianceService tenantTransportComplianceService;

    public DispatchAssignmentValidationService(RideRepository rideRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            DriverComplianceSummaryService driverComplianceSummaryService,
            VehicleComplianceSummaryService vehicleComplianceSummaryService,
            TenantTransportComplianceService tenantTransportComplianceService,
            RouteStopRepository routeStops) {
        this.rideRepository = rideRepository;
        this.routeStops = routeStops;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverComplianceSummaryService = driverComplianceSummaryService;
        this.vehicleComplianceSummaryService = vehicleComplianceSummaryService;
        this.tenantTransportComplianceService = tenantTransportComplianceService;
    }

    public Driver requireAssignableDriver(String tenantId, Ride ride, Long driverId) {
        requireTenantDispatchApproval(tenantId);
        Driver driver = driverRepository.findByIdAndTenantId(driverId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Driver was not found."));
        if (driver.getStatus() != DriverStatus.ACTIVE) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Only active drivers can be assigned to rides.");
        }
        if (driverComplianceSummaryService.getSummary(tenantId, driver)
                .overallStatus() != DriverComplianceStatus.COMPLIANT) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Driver compliance requirements must be satisfied before assignment.");
        }
        if (hasDriverConflict(tenantId, ride, driverId)) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "Driver has a conflicting trip or insufficient turnaround / transfer time.");
        }
        return driver;
    }

    public Vehicle requireAssignableVehicle(String tenantId, Ride ride, Long vehicleId) {
        requireTenantDispatchApproval(tenantId);
        Vehicle vehicle = vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Vehicle was not found."));
        if (vehicle.getStatus() != VehicleStatus.ACTIVE) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Only active vehicles can be assigned to rides.");
        }
        if (vehicleComplianceSummaryService.getSummary(tenantId, vehicle)
                .overallStatus() != VehicleComplianceStatus.COMPLIANT) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Vehicle compliance requirements must be satisfied before assignment.");
        }
        int requiredSeats = 1 + Math.max(0, ride.getCompanionCount()) + (ride.isEscortRequired() ? 1 : 0);
        if (vehicle.getCapacity() == null || vehicle.getCapacity() < requiredSeats) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Vehicle capacity is insufficient for the rider, companions, and escort.");
        }
        if (ride.isWheelchairRequired()
                && (vehicle.getWheelchairCapacity() == null || vehicle.getWheelchairCapacity() < 1)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "A wheelchair-capable vehicle is required for this ride.");
        }
        if (ride.getRouteId() != null) {
            List<Ride> pooled = new ArrayList<>(rideRepository.findAllByTenantIdAndRouteId(tenantId, ride.getRouteId()));
            pooled.removeIf(candidate -> java.util.Objects.equals(candidate.getId(), ride.getId()));
            pooled.add(ride);
            var planned = routeStops.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(tenantId, ride.getRouteId()).stream()
                    .collect(java.util.stream.Collectors.toMap(stop -> stop.getRide().getId(), stop -> stop, (a, b) -> a));
            PooledRideCapacity.validate(vehicle, pooled, planned);
        }
        if (hasVehicleConflict(tenantId, ride, vehicleId)) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "Vehicle has a conflicting trip or insufficient turnaround / transfer time.");
        }
        return vehicle;
    }

    public DispatchWarnings evaluateWarnings(String tenantId, Ride ride) {
        List<String> warningMessages = new ArrayList<>();
        boolean complianceWarning = false;
        boolean conflictWarning = false;

        if (ride.getDriverId() != null) {
            Driver driver = driverRepository.findByIdAndTenantId(ride.getDriverId(), tenantId).orElse(null);
            if (driver == null || driver.getStatus() != DriverStatus.ACTIVE) {
                complianceWarning = true;
                warningMessages.add("Assigned driver is not active.");
            } else if (driverComplianceSummaryService.getSummary(tenantId, driver)
                    .overallStatus() != DriverComplianceStatus.COMPLIANT) {
                complianceWarning = true;
                warningMessages.add("Assigned driver has outstanding compliance items.");
            }
            if (hasDriverConflict(tenantId, ride, ride.getDriverId())) {
                conflictWarning = true;
                warningMessages.add("Assigned driver has a conflicting trip or insufficient turnaround / transfer time.");
            }
        }

        if (ride.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findByIdAndTenantId(ride.getVehicleId(), tenantId).orElse(null);
            if (vehicle == null || vehicle.getStatus() != VehicleStatus.ACTIVE) {
                complianceWarning = true;
                warningMessages.add("Assigned vehicle is not active.");
            } else if (vehicleComplianceSummaryService.getSummary(tenantId, vehicle)
                    .overallStatus() != VehicleComplianceStatus.COMPLIANT) {
                complianceWarning = true;
                warningMessages.add("Assigned vehicle has outstanding compliance items.");
            }
            if (hasVehicleConflict(tenantId, ride, ride.getVehicleId())) {
                conflictWarning = true;
                warningMessages.add("Assigned vehicle has a conflicting trip or insufficient turnaround / transfer time.");
            }
        }

        return new DispatchWarnings(complianceWarning, conflictWarning, List.copyOf(warningMessages));
    }

    public java.util.Map<Long, DispatchWarnings> evaluateBatch(String tenantId, java.util.Collection<Ride> rides,
            java.util.Map<Long, Driver> drivers, java.util.Map<Long, Vehicle> vehicles) {
        if(rides.isEmpty()) return java.util.Map.of();
        var driverCompliance = new java.util.HashMap<Long, Boolean>();
        var vehicleCompliance = new java.util.HashMap<Long, Boolean>();
        var candidates = rideRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("tenantId"), tenantId), root.get("status").in(ACTIVE_ASSIGNMENT_STATUSES),
                cb.or(root.get("driverId").in(drivers.keySet()), root.get("vehicleId").in(vehicles.keySet()))));
        var result = new java.util.HashMap<Long, DispatchWarnings>();
        for(Ride ride: rides) {
            boolean compliance=false, conflict=false; var messages=new java.util.ArrayList<String>();
            if(ride.getDriverId()!=null) {
                Driver driver=drivers.get(ride.getDriverId());
                boolean valid=driver!=null && driver.getStatus()==DriverStatus.ACTIVE && driverCompliance.computeIfAbsent(driver.getId(),
                        id->driverComplianceSummaryService.getSummary(tenantId,driver).overallStatus()==DriverComplianceStatus.COMPLIANT);
                if(!valid) {compliance=true;messages.add("Assigned driver is inactive or has outstanding compliance items.");}
            }
            if(ride.getVehicleId()!=null) {
                Vehicle vehicle=vehicles.get(ride.getVehicleId());
                boolean valid=vehicle!=null && vehicle.getStatus()==VehicleStatus.ACTIVE && vehicleCompliance.computeIfAbsent(vehicle.getId(),
                        id->vehicleComplianceSummaryService.getSummary(tenantId,vehicle).overallStatus()==VehicleComplianceStatus.COMPLIANT);
                if(!valid) {compliance=true;messages.add("Assigned vehicle is inactive or has outstanding compliance items.");}
            }
            for(Ride candidate:candidates) {
                if(java.util.Objects.equals(candidate.getId(),ride.getId()) || (ride.getRouteId()!=null && java.util.Objects.equals(ride.getRouteId(),candidate.getRouteId()))) continue;
                boolean shared=(ride.getDriverId()!=null && java.util.Objects.equals(ride.getDriverId(),candidate.getDriverId()))
                        || (ride.getVehicleId()!=null && java.util.Objects.equals(ride.getVehicleId(),candidate.getVehicleId()));
                if(shared && windowsOverlap(resolveRideWindowStart(ride),resolveRideWindowEnd(ride),resolveRideWindowStart(candidate),resolveRideWindowEnd(candidate))) {conflict=true;messages.add("Assigned resource has a conflicting trip or insufficient turnaround / transfer time.");break;}
            }
            result.put(ride.getId(),new DispatchWarnings(compliance,conflict,java.util.List.copyOf(messages)));
        }
        return result;
    }

    public boolean hasDispatchException(String tenantId, Ride ride) {
        DispatchWarnings warnings = evaluateWarnings(tenantId, ride);
        return warnings.complianceWarning() || warnings.conflictWarning();
    }

    private boolean hasDriverConflict(String tenantId, Ride ride, Long driverId) {
        return rideRepository.findAllByTenantIdAndDriverIdAndStatusInAndIdNot(
                tenantId,
                driverId,
                ACTIVE_ASSIGNMENT_STATUSES,
                ride.getId() == null ? -1L : ride.getId()).stream()
                .filter(candidate -> ride.getRouteId() == null || !java.util.Objects.equals(ride.getRouteId(),candidate.getRouteId()))
                .anyMatch(candidate -> assignmentWindowsOverlap(tenantId, ride, candidate));
    }

    private boolean hasVehicleConflict(String tenantId, Ride ride, Long vehicleId) {
        return rideRepository.findAllByTenantIdAndVehicleIdAndStatusInAndIdNot(
                tenantId,
                vehicleId,
                ACTIVE_ASSIGNMENT_STATUSES,
                ride.getId() == null ? -1L : ride.getId()).stream()
                .filter(candidate -> ride.getRouteId() == null || !java.util.Objects.equals(ride.getRouteId(),candidate.getRouteId()))
                .anyMatch(candidate -> assignmentWindowsOverlap(tenantId, ride, candidate));
    }

    boolean assignmentWindowsOverlap(String tenant, Ride first, Ride second) {
        if (windowsOverlap(resolveRideWindowStart(first), resolveRideWindowEnd(first), resolveRideWindowStart(second), resolveRideWindowEnd(second))) return true;
        Ride earlier = resolveRideWindowStart(first).isBefore(resolveRideWindowStart(second)) ? first : second;
        Ride later = earlier == first ? second : first;
        if (jdbc == null || privacy == null || earlier.getId() == null || later.getId() == null) return false;
        var stops = jdbc.queryForList("SELECT ride_id,pickup_latitude,pickup_longitude,dropoff_latitude,dropoff_longitude FROM trip_verified_stops WHERE tenant_id=? AND ride_id IN (?,?)", tenant, earlier.getId(), later.getId());
        var origin = stops.stream().filter(r -> ((Number)r.get("ride_id")).longValue() == earlier.getId()).findFirst();
        var destination = stops.stream().filter(r -> ((Number)r.get("ride_id")).longValue() == later.getId()).findFirst();
        if (origin.isEmpty() || destination.isEmpty()) return false;
        double a = Math.toRadians(Double.parseDouble(privacy.decrypt(origin.get().get("dropoff_latitude").toString(), "coordinate")));
        double b = Math.toRadians(Double.parseDouble(privacy.decrypt(destination.get().get("pickup_latitude").toString(), "coordinate")));
        double longitude = Math.toRadians(Double.parseDouble(privacy.decrypt(destination.get().get("pickup_longitude").toString(), "coordinate")) - Double.parseDouble(privacy.decrypt(origin.get().get("dropoff_longitude").toString(), "coordinate")));
        double haversine = Math.pow(Math.sin((b-a)/2), 2) + Math.cos(a)*Math.cos(b)*Math.pow(Math.sin(longitude/2), 2);
        double miles = 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));
        // Conservative planning allowance, not a traffic-aware road ETA. Include a 30% road-distance allowance.
        long transfer = (long)Math.ceil(miles * 1.3 / Math.max(5, Math.min(65, transferAverageMph)) * 60);
        return !resolveRideWindowEnd(earlier).plusMinutes(transfer + Math.max(0, Math.min(1440, turnaroundMinutes))).isBefore(resolveRideWindowStart(later));
    }

    private LocalDateTime resolveRideWindowStart(Ride ride) {
        return ride.getScheduledPickupAt();
    }

    private LocalDateTime resolveRideWindowEnd(Ride ride) {
        if (ride.getReturnDropoffAt() != null) {
            return ride.getReturnDropoffAt();
        }
        if (ride.getScheduledDropoffAt() != null) {
            return ride.getScheduledDropoffAt();
        }
        return LocalDateTime.of(9999, 12, 30, 0, 0);
    }

    private boolean windowsOverlap(LocalDateTime firstStart,
            LocalDateTime firstEnd,
            LocalDateTime secondStart,
            LocalDateTime secondEnd) {
        return !firstEnd.plusMinutes(Math.max(0, Math.min(1440, turnaroundMinutes))).isBefore(secondStart) && !secondEnd.plusMinutes(Math.max(0, Math.min(1440, turnaroundMinutes))).isBefore(firstStart);
    }

    public record DispatchWarnings(
            boolean complianceWarning,
            boolean conflictWarning,
            List<String> warningMessages) {
    }

    private void requireTenantDispatchApproval(String tenantId) {
        if (!tenantTransportComplianceService.isDispatchApproved(tenantId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Transport compliance must be verified by the platform before dispatch assignments can be made.");
        }
    }
}
