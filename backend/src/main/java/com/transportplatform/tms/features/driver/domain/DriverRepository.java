package com.transportplatform.tms.features.driver.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DriverRepository extends JpaRepository<Driver, Long>, JpaSpecificationExecutor<Driver> {

    Optional<Driver> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndDriverCodeIgnoreCase(String tenantId, String driverCode);

    boolean existsByTenantIdAndEmailIgnoreCase(String tenantId, String email);

    boolean existsByTenantIdAndEmailIgnoreCaseAndIdNot(String tenantId, String email, Long id);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, DriverStatus status);

    List<Driver> findAllByTenantId(String tenantId);

    List<Driver> findAllByTenantIdAndIdIn(String tenantId, Collection<Long> ids);
}