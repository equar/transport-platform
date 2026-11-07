package com.transportplatform.tms.features.location.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverLocationSnapshotRepository extends JpaRepository<DriverLocationSnapshot, Long> {

    @org.springframework.data.jpa.repository.Query("select s from DriverLocationSnapshot s where s.tenantId = :tenantId and s.ride.id in :rideIds and not exists (select newer.id from DriverLocationSnapshot newer where newer.tenantId = s.tenantId and newer.ride.id = s.ride.id and (newer.capturedAt > s.capturedAt or (newer.capturedAt = s.capturedAt and newer.id > s.id)))")
    List<DriverLocationSnapshot> findLatestForRides(@org.springframework.data.repository.query.Param("tenantId") String tenantId,
        @org.springframework.data.repository.query.Param("rideIds") Collection<Long> rideIds);

    Optional<DriverLocationSnapshot> findTopByTenantIdAndRide_IdOrderByCapturedAtDescIdDesc(String tenantId, Long rideId);

    List<DriverLocationSnapshot> findAllByTenantIdAndRide_IdInOrderByCapturedAtDescIdDesc(String tenantId,
            Collection<Long> rideIds);
}
