package com.transportplatform.tms.features.organization.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationContactRepository extends JpaRepository<OrganizationContact, Long> {

    Optional<OrganizationContact> findByIdAndTenantId(Long id, String tenantId);

    List<OrganizationContact> findAllByTenantIdOrderByLastNameAscFirstNameAsc(String tenantId);

    List<OrganizationContact> findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(
            String tenantId,
            Long organizationId);

    List<OrganizationContact> findAllByTenantIdAndOrganization_IdInOrderByPrimaryDescUpdatedAtDesc(
            String tenantId,
            Collection<Long> organizationIds);

    Optional<OrganizationContact> findByTenantIdAndOrganization_IdAndPrimaryTrueAndStatus(
            String tenantId,
            Long organizationId,
            OrganizationContactStatus status);

    long countByTenantIdAndOrganization_Id(String tenantId, Long organizationId);
}
