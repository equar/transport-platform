package com.transportplatform.tms.features.location.application;

import com.transportplatform.tms.features.location.api.response.DriverLocationSnapshotResponse;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshot;
import org.springframework.stereotype.Component;

@Component
public class DriverLocationSnapshotMapper {

    public DriverLocationSnapshotResponse toResponse(DriverLocationSnapshot snapshot) {
        return new DriverLocationSnapshotResponse(
                snapshot.getId(),
                snapshot.getRide().getId(),
                snapshot.getDriver().getId(),
                snapshot.getVehicleId(),
                snapshot.getLatitude(),
                snapshot.getLongitude(),
                snapshot.getAccuracyMeters(),
                snapshot.getSpeedMps(),
                snapshot.getHeadingDegrees(),
                snapshot.getCapturedAt(),
                snapshot.getCreatedAt(),
                snapshot.getCreatedBy());
    }
}
