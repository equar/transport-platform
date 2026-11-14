package com.transportplatform.tms.features.driverearnings.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverEarningsLedgerRepository extends JpaRepository<DriverEarningsLedger, Long> {

    boolean existsByRideIdAndEntryType(Long rideId, DriverEarningsEntryType type);

    Optional<DriverEarningsLedger> findByIdAndTenantId(Long id, String tenantId);

    List<DriverEarningsLedger> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<DriverEarningsLedger> findAllByTenantIdAndDriverIdOrderByCreatedAtDesc(String tenantId, Long driverId);

    List<DriverEarningsLedger> findAllByTenantIdAndStatusAndEntryType(
            String tenantId,
            DriverEarningsStatus status,
            DriverEarningsEntryType entryType);

    List<DriverEarningsLedger> findAllByTenantIdAndRideIdAndStatusAndEntryType(
            String tenantId,
            Long rideId,
            DriverEarningsStatus status,
            DriverEarningsEntryType entryType);
}
