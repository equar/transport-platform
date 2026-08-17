package com.transportplatform.tms.features.location.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverLocationSnapshotRepository extends JpaRepository<DriverLocationSnapshot, Long> {

    Optional<DriverLocationSnapshot> findTopByTenantIdAndRide_IdOrderByCapturedAtDescIdDesc(String tenantId, Long rideId);

    List<DriverLocationSnapshot> findAllByTenantIdAndRide_IdInOrderByCapturedAtDescIdDesc(String tenantId,
            Collection<Long> rideIds);
}
