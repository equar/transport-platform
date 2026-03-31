package com.transportplatform.tms.features.vehicle.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VehicleDocumentRepository
        extends JpaRepository<VehicleDocument, Long>, JpaSpecificationExecutor<VehicleDocument> {

    Optional<VehicleDocument> findByIdAndTenantId(Long id, String tenantId);

    List<VehicleDocument> findAllByTenantId(String tenantId);

    List<VehicleDocument> findAllByTenantIdAndVehicle_IdIn(String tenantId, Collection<Long> vehicleIds);
}