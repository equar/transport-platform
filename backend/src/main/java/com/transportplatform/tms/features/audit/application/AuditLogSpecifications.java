package com.transportplatform.tms.features.audit.application;

import com.transportplatform.tms.features.audit.domain.AuditLog;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

public final class AuditLogSpecifications {

    private AuditLogSpecifications() {
    }

    public static Specification<AuditLog> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Specification.allOf();
        }
        String normalized = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("actorEmail")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("actorName")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("entityId")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("module")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), normalized));
    }

    public static Specification<AuditLog> module(String module) {
        if (module == null || module.isBlank()) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("module"), module.trim().toUpperCase());
    }

    public static Specification<AuditLog> action(String action) {
        if (action == null || action.isBlank()) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("action"), action.trim().toUpperCase());
    }

    public static Specification<AuditLog> tenantScope(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("tenantId"), tenantId);
    }

    public static Specification<AuditLog> createdAtFrom(Instant createdAtFrom) {
        if (createdAtFrom == null) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"),
                createdAtFrom);
    }

    public static Specification<AuditLog> createdAtTo(Instant createdAtTo) {
        if (createdAtTo == null) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.lessThan(root.get("createdAt"), createdAtTo);
    }
}