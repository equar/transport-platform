package com.transportplatform.tms.features.compliance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantTransportComplianceRepository extends JpaRepository<TenantTransportCompliance, String> {}

