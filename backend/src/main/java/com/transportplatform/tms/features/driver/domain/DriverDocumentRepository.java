package com.transportplatform.tms.features.driver.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DriverDocumentRepository
        extends JpaRepository<DriverDocument, Long>, JpaSpecificationExecutor<DriverDocument> {

    Optional<DriverDocument> findByIdAndTenantId(Long id, String tenantId);

    List<DriverDocument> findAllByTenantId(String tenantId);

    List<DriverDocument> findAllByTenantIdAndDriver_IdIn(String tenantId, Collection<Long> driverIds);
}