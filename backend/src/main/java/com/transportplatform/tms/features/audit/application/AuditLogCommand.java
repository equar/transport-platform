package com.transportplatform.tms.features.audit.application;

public record AuditLogCommand(
        AuditLogActor actor,
        String tenantId,
        String module,
        String action,
        String entityType,
        String entityId,
        String summary,
        Object oldValue,
        Object newValue) {
}