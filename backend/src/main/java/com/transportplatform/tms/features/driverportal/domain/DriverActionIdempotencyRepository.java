package com.transportplatform.tms.features.driverportal.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverActionIdempotencyRepository extends JpaRepository<DriverActionIdempotency, Long> {
    boolean existsByTenantIdAndUserIdAndIdempotencyKey(String tenantId, Long userId, String idempotencyKey);
}

