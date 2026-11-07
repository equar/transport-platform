package com.transportplatform.tms.features.vehicle.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndVehicleCodeIgnoreCase(String tenantId, String vehicleCode);

    boolean existsByTenantIdAndVinIgnoreCase(String tenantId, String vin);

    boolean existsByTenantIdAndVinIgnoreCaseAndIdNot(String tenantId, String vin, Long id);

    boolean existsByTenantIdAndPlateNumberIgnoreCaseAndPlateStateIgnoreCase(
            String tenantId,
            String plateNumber,
            String plateState);

    boolean existsByTenantIdAndPlateNumberIgnoreCaseAndPlateStateIgnoreCaseAndIdNot(
            String tenantId,
            String plateNumber,
            String plateState,
            Long id);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, VehicleStatus status);

    List<Vehicle> findAllByTenantId(String tenantId);

    @org.springframework.data.jpa.repository.Query("select v from Vehicle v where v.tenantId = :tenantId and (v.ownerDriverId = :driverId or v.assignedDriverId = :driverId) order by v.vehicleCode")
    List<Vehicle> findAllForDriver(@org.springframework.data.repository.query.Param("tenantId") String tenantId,
            @org.springframework.data.repository.query.Param("driverId") Long driverId);

    List<Vehicle> findAllByTenantIdAndIdIn(String tenantId, Collection<Long> ids);
}