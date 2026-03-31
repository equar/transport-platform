package com.transportplatform.tms.features.audit.api.response;

import java.time.Instant;

public record DashboardActivityResponse(
        Long id,
        Instant createdAt,
        String actorName,
        String actorEmail,
        String module,
        String action,
        String entityType,
        String entityId,
        String summary,
        String tenantId) {
}