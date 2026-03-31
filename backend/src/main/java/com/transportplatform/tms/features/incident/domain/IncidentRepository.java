package com.transportplatform.tms.features.incident.domain;

import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    Optional<Incident> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndIncidentCodeIgnoreCase(String tenantId, String incidentCode);

    long countByTenantIdAndStatusIn(String tenantId, Collection<IncidentStatus> statuses);

    long countByTenantIdAndSeverityAndStatusIn(String tenantId,
            IncidentSeverity severity,
            Collection<IncidentStatus> statuses);
}