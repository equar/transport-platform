package com.transportplatform.tms.features.organization.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ServiceAreaRepository extends JpaRepository<ServiceArea, Long>, JpaSpecificationExecutor<ServiceArea> {

    Optional<ServiceArea> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndAreaCodeIgnoreCase(String tenantId, String areaCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, ServiceAreaStatus status);
}