package com.transportplatform.tms.features.organization.domain;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ContractRepository extends JpaRepository<Contract, Long>, JpaSpecificationExecutor<Contract> {

    Optional<Contract> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndContractCodeIgnoreCase(String tenantId, String contractCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, ContractStatus status);

    long countByTenantIdAndStatusAndEndDateGreaterThanEqual(String tenantId, ContractStatus status, LocalDate endDate);

    long countByTenantIdAndStatusAndEndDateIsNull(String tenantId, ContractStatus status);

    long countByTenantIdAndStatusInAndEndDateBetween(
            String tenantId,
            Collection<ContractStatus> statuses,
            LocalDate startDate,
            LocalDate endDate);

    List<Contract> findAllByTenantIdAndOrganization_IdInOrderByUpdatedAtDesc(String tenantId,
            Collection<Long> organizationIds);

    List<Contract> findTop10ByTenantIdAndOrganization_IdOrderByUpdatedAtDesc(String tenantId, Long organizationId);
}