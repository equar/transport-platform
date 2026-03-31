package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import org.springframework.data.jpa.domain.Specification;

public final class GuardianSpecifications {

    private GuardianSpecifications() {
    }

    public static Specification<Guardian> search(String tenantId,
            String keyword,
            GuardianStatus status,
            Boolean authorizedForPickup,
            Boolean billingContact) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("firstName")), pattern),
                        builder.like(builder.lower(root.get("lastName")), pattern),
                        builder.like(builder.lower(root.get("email")), pattern),
                        builder.like(builder.lower(root.get("phone")), pattern),
                        builder.like(builder.lower(root.get("alternatePhone")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (authorizedForPickup != null) {
                predicate = builder.and(predicate,
                        builder.equal(root.get("authorizedForPickup"), authorizedForPickup));
            }
            if (billingContact != null) {
                predicate = builder.and(predicate, builder.equal(root.get("billingContact"), billingContact));
            }
            return predicate;
        };
    }
}