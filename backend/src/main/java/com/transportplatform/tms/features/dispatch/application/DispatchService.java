package com.transportplatform.tms.features.dispatch.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.dispatch.api.response.DispatchBoardSummaryResponse;
import com.transportplatform.tms.features.dispatch.api.response.DispatchRideMapResponse;
import com.transportplatform.tms.features.dispatch.api.response.DispatchRideSummaryResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshot;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.application.RideStatusWorkflow;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DispatchService {

        private static final EnumSet<RideStatus> IN_PROGRESS_STATUSES = EnumSet.of(
                        RideStatus.DRIVER_EN_ROUTE,
                        RideStatus.ARRIVED,
                        RideStatus.PICKED_UP,
                        RideStatus.DROPPED_OFF);

        private static final EnumSet<RideStatus> EXCEPTION_STATUSES = EnumSet.of(
                        RideStatus.RIDER_NO_SHOW,
                        RideStatus.MISSED,
                        RideStatus.FAILED);

        private static final EnumSet<RideStatus> MAP_ACTIVE_STATUSES = EnumSet.of(
                        RideStatus.ASSIGNED,
                        RideStatus.DRIVER_EN_ROUTE,
                        RideStatus.ARRIVED,
                        RideStatus.PICKED_UP,
                        RideStatus.DROPPED_OFF);

        private final RideRepository rideRepository;
        private final DriverLocationSnapshotRepository driverLocationSnapshotRepository;
        private final DriverRepository driverRepository;
        private final VehicleRepository vehicleRepository;
        private final RideAccessService rideAccessService;
        private final DispatchAssignmentValidationService dispatchAssignmentValidationService;
        private final DispatchMapper dispatchMapper;
        private final RideEventService rideEventService;
        private final AuditLogService auditLogService;
        private final NotificationEventService notificationEventService;

        public DispatchService(RideRepository rideRepository,
                        DriverLocationSnapshotRepository driverLocationSnapshotRepository,
                        DriverRepository driverRepository,
                        VehicleRepository vehicleRepository,
                        RideAccessService rideAccessService,
                        DispatchAssignmentValidationService dispatchAssignmentValidationService,
                        DispatchMapper dispatchMapper,
                        RideEventService rideEventService,
                        AuditLogService auditLogService,
                        NotificationEventService notificationEventService) {
                this.rideRepository = rideRepository;
                this.driverLocationSnapshotRepository = driverLocationSnapshotRepository;
                this.driverRepository = driverRepository;
                this.vehicleRepository = vehicleRepository;
                this.rideAccessService = rideAccessService;
                this.dispatchAssignmentValidationService = dispatchAssignmentValidationService;
                this.dispatchMapper = dispatchMapper;
                this.rideEventService = rideEventService;
                this.auditLogService = auditLogService;
                this.notificationEventService = notificationEventService;
        }

        @Transactional(readOnly = true)
        public PageResponse<DispatchRideSummaryResponse> searchCompanyDispatchBoard(String keyword,
                        DispatchRideView view,
                        RideStatus status,
                        ServiceType serviceType,
                        Long driverId,
                        Long vehicleId,
                        Long organizationId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        int page,
                        int size,
                        String sortBy,
                        Sort.Direction sortDirection) {
                String tenantId = rideAccessService.requireCompanyTenantId();
                LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
                LocalDateTime toDateTime = toDate == null ? null : LocalDateTime.of(toDate, LocalTime.MAX);
                var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
                if (view == DispatchRideView.EXCEPTIONS) {
                        List<Ride> rides = rideRepository.findAll(
                                        DispatchRideSpecifications.search(
                                                        tenantId,
                                                        keyword,
                                                        null,
                                                        status,
                                                        serviceType,
                                                        driverId,
                                                        vehicleId,
                                                        organizationId,
                                                        fromDateTime,
                                                        toDateTime),
                                        Sort.by(sortDirection, resolveSortField(sortBy)));
                        List<DispatchRideSummaryResponse> filtered = mapDispatchResponses(tenantId, rides).stream()
                                        .filter(item -> item.complianceWarning() || item.conflictWarning()
                                                        || EXCEPTION_STATUSES.contains(item.status()))
                                        .toList();
                        return paginate(filtered, page, size);
                }

                var result = rideRepository.findAll(
                                DispatchRideSpecifications.search(
                                                tenantId,
                                                keyword,
                                                view,
                                                status,
                                                serviceType,
                                                driverId,
                                                vehicleId,
                                                organizationId,
                                                fromDateTime,
                                                toDateTime),
                                pageable);
                return PageResponse.from(new PageImpl<>(mapDispatchResponses(tenantId, result.getContent()), pageable,
                                result.getTotalElements()));
        }

        @Transactional(readOnly = true)
        public DispatchBoardSummaryResponse getCompanyDispatchBoardSummary(String keyword,
                        RideStatus status,
                        ServiceType serviceType,
                        Long driverId,
                        Long vehicleId,
                        Long organizationId,
                        LocalDate fromDate,
                        LocalDate toDate) {
                String tenantId = rideAccessService.requireCompanyTenantId();
                LocalDateTime fromDateTime = fromDate == null ? LocalDate.now().atStartOfDay()
                                : fromDate.atStartOfDay();
                LocalDateTime toDateTime = toDate == null ? LocalDateTime.of(LocalDate.now(), LocalTime.MAX)
                                : LocalDateTime.of(toDate, LocalTime.MAX);

                List<Ride> rides = rideRepository.findAll(
                                DispatchRideSpecifications.search(
                                                tenantId,
                                                keyword,
                                                null,
                                                status,
                                                serviceType,
                                                driverId,
                                                vehicleId,
                                                organizationId,
                                                fromDateTime,
                                                toDateTime),
                                Sort.by(Sort.Direction.ASC, "scheduledPickupAt"));
                List<DispatchRideSummaryResponse> items = mapDispatchResponses(tenantId, rides);
                long scheduledCount = items.stream().filter(item -> item.status() == RideStatus.SCHEDULED).count();
                long assignedCount = items.stream().filter(item -> item.status() == RideStatus.ASSIGNED).count();
                long inProgressCount = items.stream().filter(item -> IN_PROGRESS_STATUSES.contains(item.status()))
                                .count();
                long exceptionCount = items.stream().filter(item -> item.complianceWarning() || item.conflictWarning()
                                || EXCEPTION_STATUSES.contains(item.status())).count();
                long completedTodayCount = rideRepository.countByTenantIdAndStatusInAndScheduledPickupAtBetween(
                                tenantId,
                                EnumSet.of(RideStatus.COMPLETED),
                                LocalDate.now().atStartOfDay(),
                                LocalDateTime.of(LocalDate.now(), LocalTime.MAX));
                long noShowTodayCount = rideRepository.countByTenantIdAndStatusInAndScheduledPickupAtBetween(
                                tenantId,
                                EnumSet.of(RideStatus.RIDER_NO_SHOW),
                                LocalDate.now().atStartOfDay(),
                                LocalDateTime.of(LocalDate.now(), LocalTime.MAX));
                return new DispatchBoardSummaryResponse(
                                scheduledCount,
                                assignedCount,
                                inProgressCount,
                                exceptionCount,
                                completedTodayCount,
                                noShowTodayCount);
        }

        @Transactional(readOnly = true)
        public List<DispatchRideMapResponse> getCompanyDispatchMap(String keyword,
                        RideStatus status,
                        ServiceType serviceType,
                        Long driverId,
                        Long vehicleId,
                        Long organizationId,
                        LocalDate fromDate,
                        LocalDate toDate) {
                String tenantId = rideAccessService.requireCompanyTenantId();
                LocalDateTime fromDateTime = fromDate == null ? LocalDate.now().atStartOfDay()
                                : fromDate.atStartOfDay();
                LocalDateTime toDateTime = toDate == null ? LocalDateTime.of(LocalDate.now(), LocalTime.MAX)
                                : LocalDateTime.of(toDate, LocalTime.MAX);

                List<Ride> rides = rideRepository.findAll(
                                DispatchRideSpecifications.search(
                                                tenantId,
                                                keyword,
                                                null,
                                                status,
                                                serviceType,
                                                driverId,
                                                vehicleId,
                                                organizationId,
                                                fromDateTime,
                                                toDateTime),
                                Sort.by(Sort.Direction.ASC, "scheduledPickupAt")).stream()
                                .filter(ride -> MAP_ACTIVE_STATUSES.contains(ride.getStatus()))
                                .filter(ride -> ride.getDriverId() != null)
                                .toList();
                if (rides.isEmpty()) {
                        return List.of();
                }

                Map<Long, DriverLocationSnapshot> latestSnapshotsByRideId = driverLocationSnapshotRepository
                                .findAllByTenantIdAndRide_IdInOrderByCapturedAtDescIdDesc(
                                                tenantId,
                                                rides.stream().map(Ride::getId).toList())
                                .stream()
                                .collect(Collectors.toMap(
                                                snapshot -> snapshot.getRide().getId(),
                                                Function.identity(),
                                                (first, ignored) -> first,
                                                LinkedHashMap::new));

                Map<Long, Driver> driversById = driverRepository.findAllByTenantIdAndIdIn(
                                tenantId,
                                rides.stream().map(Ride::getDriverId).toList()).stream()
                                .collect(Collectors.toMap(Driver::getId, Function.identity()));
                Map<Long, Vehicle> vehiclesById = vehicleRepository.findAllByTenantIdAndIdIn(
                                tenantId,
                                rides.stream()
                                                .map(Ride::getVehicleId)
                                                .filter(java.util.Objects::nonNull)
                                                .toList()).stream()
                                .collect(Collectors.toMap(Vehicle::getId, Function.identity()));

                return rides.stream()
                                .map(ride -> {
                                        DriverLocationSnapshot snapshot = latestSnapshotsByRideId.get(ride.getId());
                                        if (snapshot == null) {
                                                return null;
                                        }
                                        Driver driver = driversById.get(ride.getDriverId());
                                        Vehicle vehicle = ride.getVehicleId() == null ? null
                                                        : vehiclesById.get(ride.getVehicleId());
                                        return dispatchMapper.toMapResponse(ride, driver, vehicle, snapshot);
                                })
                                .filter(java.util.Objects::nonNull)
                                .toList();
        }

        @Transactional
        public void assignRideDriver(Long rideId, Long driverId) {
                Ride ride = rideAccessService.findRideForCompanyScope(rideId);
                RideStatusWorkflow.ensureCanAssignResources(ride.getStatus());
                Object oldSnapshot = snapshot(ride);
                Driver driver = dispatchAssignmentValidationService.requireAssignableDriver(ride.getTenantId(), ride,
                                driverId);
                RideStatus previousStatus = ride.getStatus();
                ride.setDriverId(driver.getId());
                if (ride.getStatus() == RideStatus.SCHEDULED) {
                        ride.setStatus(RideStatus.ASSIGNED);
                }
                Ride saved = rideRepository.save(ride);
                rideEventService.recordDriverAssigned(saved, driver.getDriverCode(), null);
                if (previousStatus != saved.getStatus()) {
                        rideEventService.recordStatusChanged(saved, previousStatus, saved.getStatus(),
                                        "Ride resources are fully assigned.");
                        notificationEventService.publishRideStatusChanged(saved, previousStatus, saved.getStatus());
                }
                recordAudit(saved, "DRIVER_ASSIGNED", "Driver assigned to ride " + saved.getRideNumber() + ".",
                                oldSnapshot, snapshot(saved));
                notificationEventService.publishRideDriverAssigned(saved, driver);
        }

        @Transactional
        public void assignRideVehicle(Long rideId, Long vehicleId) {
                Ride ride = rideAccessService.findRideForCompanyScope(rideId);
                RideStatusWorkflow.ensureCanAssignResources(ride.getStatus());
                Object oldSnapshot = snapshot(ride);
                Vehicle vehicle = dispatchAssignmentValidationService.requireAssignableVehicle(ride.getTenantId(), ride,
                                vehicleId);
                RideStatus previousStatus = ride.getStatus();
                ride.setVehicleId(vehicle.getId());
                if (ride.getDriverId() != null && ride.getStatus() == RideStatus.SCHEDULED) {
                        ride.setStatus(RideStatus.ASSIGNED);
                }
                Ride saved = rideRepository.save(ride);
                rideEventService.recordVehicleAssigned(saved, vehicle.getVehicleCode(), null);
                if (previousStatus != saved.getStatus()) {
                        rideEventService.recordStatusChanged(saved, previousStatus, saved.getStatus(),
                                        "Ride resources are fully assigned.");
                        notificationEventService.publishRideStatusChanged(saved, previousStatus, saved.getStatus());
                }
                recordAudit(saved, "VEHICLE_ASSIGNED", "Vehicle assigned to ride " + saved.getRideNumber() + ".",
                                oldSnapshot, snapshot(saved));
                notificationEventService.publishRideVehicleAssigned(saved, vehicle);
        }

        @Transactional
        public void assignRideResources(Long rideId, Long driverId, Long vehicleId) {
                if (driverId == null && vehicleId == null) {
                        throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                                        "At least one ride resource must be provided.");
                }
                if (driverId != null) {
                        assignRideDriver(rideId, driverId);
                }
                if (vehicleId != null) {
                        assignRideVehicle(rideId, vehicleId);
                }
        }

        @Transactional
        public void unassignRideDriver(Long rideId) {
                Ride ride = rideAccessService.findRideForCompanyScope(rideId);
                RideStatusWorkflow.ensureCanUnassignResources(ride.getStatus());
                Object oldSnapshot = snapshot(ride);
                Long previousDriverId = ride.getDriverId();
                RideStatus previousStatus = ride.getStatus();
                ride.setDriverId(null);
                if (ride.getStatus() == RideStatus.ASSIGNED) {
                        ride.setStatus(RideStatus.SCHEDULED);
                }
                Ride saved = rideRepository.save(ride);
                rideEventService.recordDriverUnassigned(saved,
                                previousDriverId == null ? null : previousDriverId.toString(),
                                null);
                if (previousStatus != saved.getStatus()) {
                        rideEventService.recordStatusChanged(saved, previousStatus, saved.getStatus(),
                                        "Driver assignment was removed.");
                }
                recordAudit(saved, "DRIVER_UNASSIGNED",
                                "Driver assignment removed from ride " + saved.getRideNumber() + ".",
                                oldSnapshot, snapshot(saved));
        }

        @Transactional
        public void unassignRideVehicle(Long rideId) {
                Ride ride = rideAccessService.findRideForCompanyScope(rideId);
                RideStatusWorkflow.ensureCanUnassignResources(ride.getStatus());
                Object oldSnapshot = snapshot(ride);
                Long previousVehicleId = ride.getVehicleId();
                RideStatus previousStatus = ride.getStatus();
                ride.setVehicleId(null);
                if (ride.getStatus() == RideStatus.ASSIGNED) {
                        ride.setStatus(RideStatus.SCHEDULED);
                }
                Ride saved = rideRepository.save(ride);
                rideEventService.recordVehicleUnassigned(saved,
                                previousVehicleId == null ? null : previousVehicleId.toString(), null);
                if (previousStatus != saved.getStatus()) {
                        rideEventService.recordStatusChanged(saved, previousStatus, saved.getStatus(),
                                        "Vehicle assignment was removed.");
                }
                recordAudit(saved, "VEHICLE_UNASSIGNED",
                                "Vehicle assignment removed from ride " + saved.getRideNumber() + ".",
                                oldSnapshot, snapshot(saved));
        }

        private List<DispatchRideSummaryResponse> mapDispatchResponses(String tenantId, Collection<Ride> rides) {
                Map<Long, Driver> driversById = driverRepository.findAllByTenantId(tenantId).stream()
                                .collect(Collectors.toMap(Driver::getId, Function.identity()));
                Map<Long, Vehicle> vehiclesById = vehicleRepository.findAllByTenantId(tenantId).stream()
                                .collect(Collectors.toMap(Vehicle::getId, Function.identity()));
                return rides.stream()
                                .map(ride -> dispatchMapper.toSummaryResponse(
                                                ride,
                                                ride.getDriverId() == null ? null : driversById.get(ride.getDriverId()),
                                                ride.getVehicleId() == null ? null
                                                                : vehiclesById.get(ride.getVehicleId()),
                                                dispatchAssignmentValidationService.evaluateWarnings(tenantId, ride)))
                                .toList();
        }

        private PageResponse<DispatchRideSummaryResponse> paginate(List<DispatchRideSummaryResponse> items, int page,
                        int size) {
                int fromIndex = Math.min(page * size, items.size());
                int toIndex = Math.min(fromIndex + size, items.size());
                return PageResponse
                                .from(new PageImpl<>(items.subList(fromIndex, toIndex), PageRequest.of(page, size),
                                                items.size()));
        }

        private void recordAudit(Ride ride, String action, String summary, Object oldValue, Object newValue) {
                auditLogService.record(new AuditLogCommand(
                                null,
                                ride.getTenantId(),
                                "RIDE",
                                action,
                                "RIDE",
                                ride.getId().toString(),
                                summary,
                                oldValue,
                                newValue));
        }

        private Object snapshot(Ride ride) {
                Map<String, Object> values = new LinkedHashMap<>();
                values.put("id", ride.getId());
                values.put("rideNumber", ride.getRideNumber());
                values.put("status", ride.getStatus() == null ? null : ride.getStatus().name());
                values.put("driverId", ride.getDriverId());
                values.put("vehicleId", ride.getVehicleId());
                values.put("routeId", ride.getRouteId());
                return values;
        }

        private String resolveSortField(String sortBy) {
                String resolved = sortBy == null ? "scheduledPickupAt" : sortBy;
                return switch (resolved) {
                        case "createdAt", "updatedAt", "rideNumber", "scheduledPickupAt", "scheduledDropoffAt",
                                        "status" ->
                                resolved;
                        default -> "scheduledPickupAt";
                };
        }
}
