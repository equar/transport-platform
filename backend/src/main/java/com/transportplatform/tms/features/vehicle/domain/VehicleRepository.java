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

    List<Vehicle> findAllByTenantIdAndIdIn(String tenantId, Collection<Long> ids);
}