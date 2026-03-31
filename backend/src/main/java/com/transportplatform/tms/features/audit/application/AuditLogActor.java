package com.transportplatform.tms.features.audit.application;

public record AuditLogActor(
        Long userId,
        String email,
        String name) {
}