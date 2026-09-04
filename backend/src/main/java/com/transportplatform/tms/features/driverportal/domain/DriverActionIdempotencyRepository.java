package com.transportplatform.tms.features.driverportal.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverActionIdempotencyRepository extends JpaRepository<DriverActionIdempotency, Long> {
    Optional<DriverActionIdempotency> findByTenantIdAndUserIdAndIdempotencyKey(
            String tenantId, Long userId, String idempotencyKey);
}

