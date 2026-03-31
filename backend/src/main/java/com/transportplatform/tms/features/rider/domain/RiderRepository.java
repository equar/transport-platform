package com.transportplatform.tms.features.rider.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RiderRepository extends JpaRepository<Rider, Long>, JpaSpecificationExecutor<Rider> {

    Optional<Rider> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndRiderCodeIgnoreCase(String tenantId, String riderCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, RiderStatus status);

    long countByTenantIdAndWheelchairRequiredTrue(String tenantId);

    long countByTenantIdAndEscortRequiredTrue(String tenantId);

    long countByTenantIdAndOrganizationId(String tenantId, Long organizationId);

    List<Rider> findAllByTenantId(String tenantId);

    List<Rider> findTop10ByTenantIdAndOrganizationIdOrderByLastNameAscFirstNameAsc(String tenantId,
            Long organizationId);
}