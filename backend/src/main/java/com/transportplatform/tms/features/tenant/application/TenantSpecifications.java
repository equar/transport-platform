package com.transportplatform.tms.features.tenant.application;

import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TenantSpecifications {

    private TenantSpecifications() {
    }

    public static Specification<Tenant> search(String keyword, TenantStatus status) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(
                        predicate,
                        builder.or(
                                builder.like(builder.lower(root.get("tenantCode")), pattern),
                                builder.like(builder.lower(root.get("companyName")), pattern),
                                builder.like(builder.lower(root.get("legalName")), pattern),
                                builder.like(builder.lower(root.get("email")), pattern),
                                builder.like(builder.lower(root.get("phone")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            return predicate;
        };
    }
}
