package com.transportplatform.tms.features.billing.domain;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceGenerationIdempotencyRepository extends JpaRepository<InvoiceGenerationIdempotency, Long> {

    Optional<InvoiceGenerationIdempotency> findByTenantIdAndUserIdAndIdempotencyKey(
            String tenantId, Long userId, String idempotencyKey);

    @Modifying
    @Query(value = "INSERT IGNORE INTO invoice_generation_idempotency "
            + "(tenant_id, user_id, idempotency_key, request_hash, created_at) "
            + "VALUES (:tenantId, :userId, :idempotencyKey, :requestHash, :createdAt)", nativeQuery = true)
    int claim(@Param("tenantId") String tenantId,
            @Param("userId") Long userId,
            @Param("idempotencyKey") String idempotencyKey,
            @Param("requestHash") String requestHash,
            @Param("createdAt") Instant createdAt);
}