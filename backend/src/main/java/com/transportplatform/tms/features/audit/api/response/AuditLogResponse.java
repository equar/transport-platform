package com.transportplatform.tms.features.audit.api.response;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Long actorUserId,
        String actorName,
        String actorEmail,
        String tenantId,
        String module,
        String action,
        String entityType,
        String entityId,
        String summary,
        String oldValueJson,
        String newValueJson,
        Instant createdAt) {
}