package com.transportplatform.tms.features.user.application;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import org.springframework.data.jpa.domain.Specification;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<AppUser> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Specification.allOf();
        }
        String normalized = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), normalized),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), normalized));
    }

    public static Specification<AppUser> status(UserStatus status) {
        if (status == null) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<AppUser> role(RoleName role) {
        if (role == null) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> {
            query.distinct(true);
            return criteriaBuilder.equal(root.join("roles"), role);
        };
    }

    public static Specification<AppUser> tenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Specification.allOf();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("tenantId"), tenantId.trim());
    }

    public static Specification<AppUser> platformScopeOnly() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isNull(root.get("tenantId"));
    }
}