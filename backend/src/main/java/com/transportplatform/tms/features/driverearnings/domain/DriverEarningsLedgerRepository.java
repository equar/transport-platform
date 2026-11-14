package com.transportplatform.tms.features.driverearnings.domain;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface DriverEarningsLedgerRepository extends JpaRepository<DriverEarningsLedger,Long> { boolean existsByRideIdAndEntryType(Long rideId, DriverEarningsEntryType type); List<DriverEarningsLedger> findAllByTenantIdOrderByCreatedAtDesc(String tenantId); List<DriverEarningsLedger> findAllByTenantIdAndDriverIdOrderByCreatedAtDesc(String tenantId, Long driverId); }
