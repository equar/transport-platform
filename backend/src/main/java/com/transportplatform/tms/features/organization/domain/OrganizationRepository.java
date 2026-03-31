package com.transportplatform.tms.features.organization.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrganizationRepository
        extends JpaRepository<Organization, Long>, JpaSpecificationExecutor<Organization> {

    Optional<Organization> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndOrganizationCodeIgnoreCase(String tenantId, String organizationCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, OrganizationStatus status);

    List<Organization> findAllByTenantId(String tenantId);

    List<Organization> findAllByTenantIdAndStatusOrderByNameAsc(String tenantId, OrganizationStatus status);
}