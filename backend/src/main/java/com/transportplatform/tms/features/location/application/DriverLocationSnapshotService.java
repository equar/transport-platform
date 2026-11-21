package com.transportplatform.tms.features.location.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.location.api.request.DriverLocationSnapshotRequest;
import com.transportplatform.tms.features.location.api.response.DriverLocationSnapshotResponse;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshot;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverLocationSnapshotService {
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate db;

    private static final Set<RideStatus> TRACKABLE_RIDE_STATUSES = Set.of(
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP);

    private final DriverPortalAccessService driverPortalAccessService;
    private final RideAccessService rideAccessService;
    private final DriverLocationSnapshotRepository repository;
    private final DriverLocationSnapshotMapper mapper;
    private final Clock clock;

    public DriverLocationSnapshotService(DriverPortalAccessService driverPortalAccessService,
            RideAccessService rideAccessService,
            DriverLocationSnapshotRepository repository,
            DriverLocationSnapshotMapper mapper,
            Clock clock) {
        this.driverPortalAccessService = driverPortalAccessService;
        this.rideAccessService = rideAccessService;
        this.repository = repository;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public DriverLocationSnapshotResponse captureDriverRideSnapshot(Long rideId, DriverLocationSnapshotRequest request) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        ensureTrackable(ride);
        Driver driver = driverPortalAccessService.resolveCurrentDriver();

        db.queryForList("SELECT id FROM drivers WHERE id=? AND tenant_id=? FOR UPDATE", driver.getId(), ride.getTenantId());
        Instant captured = resolveCapturedAt(request.capturedAt());
        var previous = repository.findTopByTenantIdAndDriver_IdOrderByCapturedAtDescIdDesc(ride.getTenantId(), driver.getId());
        if (previous.isPresent()) {
            var last = previous.get();
            if (last.getCreatedAt() != null && last.getCreatedAt().isAfter(clock.instant().minusSeconds(5)))
                throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.TOO_MANY_REQUESTS, "Location uploads must be at least five seconds apart.");
            if (!captured.isAfter(last.getCapturedAt())) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT, "Location samples must arrive in chronological order.");
        }
        DriverLocationSnapshot snapshot = new DriverLocationSnapshot();
        snapshot.setTenantId(ride.getTenantId());
        snapshot.setRide(ride);
        snapshot.setDriver(driver);
        snapshot.setVehicleId(ride.getVehicleId());
        snapshot.setLatitude(request.latitude());
        snapshot.setLongitude(request.longitude());
        snapshot.setAccuracyMeters(request.accuracyMeters());
        snapshot.setSpeedMps(request.speedMps());
        snapshot.setHeadingDegrees(request.headingDegrees());
        snapshot.setCapturedAt(captured);
        DriverLocationSnapshot saved = repository.save(snapshot);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DriverLocationSnapshotResponse getLatestCompanyRideSnapshot(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        if (!TRACKABLE_RIDE_STATUSES.contains(ride.getStatus()) || ride.getDriverId() == null) return null;
        return repository.findTopByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc(ride.getTenantId(), ride.getId(), ride.getDriverId())
                .map(mapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public DriverLocationSnapshotResponse getLatestDriverRideSnapshot(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        if (!TRACKABLE_RIDE_STATUSES.contains(ride.getStatus()) || ride.getDriverId() == null) return null;
        return repository.findTopByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc(ride.getTenantId(), ride.getId(), ride.getDriverId())
                .map(mapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public java.util.List<DriverLocationSnapshotResponse> getDriverRideHistory(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        if (!TRACKABLE_RIDE_STATUSES.contains(ride.getStatus()) || ride.getDriverId() == null) return java.util.List.of();
        return repository.findTop1000ByTenantIdAndRide_IdAndDriver_IdOrderByCapturedAtDescIdDesc(
                ride.getTenantId(), ride.getId(), ride.getDriverId()).stream().map(mapper::toResponse).toList();
    }

    private void ensureTrackable(Ride ride) {
        if (!TRACKABLE_RIDE_STATUSES.contains(ride.getStatus())) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "Location snapshots can only be captured while the ride is actively in progress.");
        }
    }

    private Instant resolveCapturedAt(Instant providedCapturedAt) {
        Instant now = Instant.now(clock);
        if (providedCapturedAt == null) {
            return now;
        }
        if (providedCapturedAt.isBefore(now.minusSeconds(300)) || providedCapturedAt.isAfter(now.plusSeconds(60))) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Location capture time must be within five minutes in the past and one minute in the future.");
        }
        return providedCapturedAt;
    }
}
