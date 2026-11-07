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

    private static final Set<RideStatus> TRACKABLE_RIDE_STATUSES = Set.of(
            RideStatus.ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.ARRIVED,
            RideStatus.PICKED_UP,
            RideStatus.DROPPED_OFF);

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
        snapshot.setCapturedAt(resolveCapturedAt(request.capturedAt()));
        DriverLocationSnapshot saved = repository.save(snapshot);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DriverLocationSnapshotResponse getLatestCompanyRideSnapshot(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        return repository.findTopByTenantIdAndRide_IdOrderByCapturedAtDescIdDesc(ride.getTenantId(), ride.getId())
                .map(mapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public DriverLocationSnapshotResponse getLatestDriverRideSnapshot(Long rideId) {
        Ride ride = driverPortalAccessService.requireAssignedRide(rideId);
        return repository.findTopByTenantIdAndRide_IdOrderByCapturedAtDescIdDesc(ride.getTenantId(), ride.getId())
                .map(mapper::toResponse)
                .orElse(null);
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
        if (providedCapturedAt.isAfter(now.plusSeconds(300))) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Location capture time cannot be more than five minutes in the future.");
        }
        return providedCapturedAt;
    }
}
