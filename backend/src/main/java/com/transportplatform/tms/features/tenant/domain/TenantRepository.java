package com.transportplatform.tms.features.tenant.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, String>, JpaSpecificationExecutor<Tenant> {

    boolean existsByTenantCodeIgnoreCase(String tenantCode);

    Optional<Tenant> findByTenantCodeIgnoreCase(String tenantCode);

    boolean existsByTenantCodeIgnoreCaseAndIdNot(String tenantCode, String id);

    boolean existsByLegalNameIgnoreCase(String legalName);

    boolean existsByLegalNameIgnoreCaseAndIdNot(String legalName, String id);

    long countByStatus(TenantStatus status);
}
