package com.transportplatform.tms.features.tenant.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, String>, JpaSpecificationExecutor<Tenant> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select t from Tenant t where t.id = :tenantId")
    Optional<Tenant> lockForDispatch(@org.springframework.data.repository.query.Param("tenantId") String tenantId);

    boolean existsByTenantCodeIgnoreCase(String tenantCode);

    Optional<Tenant> findByTenantCodeIgnoreCase(String tenantCode);


    boolean existsByTenantCodeIgnoreCaseAndIdNot(String tenantCode, String id);

    boolean existsByLegalNameIgnoreCase(String legalName);

    boolean existsByLegalNameIgnoreCaseAndIdNot(String legalName, String id);

    long countByStatus(TenantStatus status);
}
