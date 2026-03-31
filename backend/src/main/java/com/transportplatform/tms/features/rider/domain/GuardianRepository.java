package com.transportplatform.tms.features.rider.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GuardianRepository extends JpaRepository<Guardian, Long>, JpaSpecificationExecutor<Guardian> {

    Optional<Guardian> findByIdAndTenantId(Long id, String tenantId);

    List<Guardian> findAllByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, GuardianStatus status);
}