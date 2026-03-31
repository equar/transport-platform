package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import org.springframework.data.jpa.domain.Specification;

public final class RiderSpecifications {

    private RiderSpecifications() {
    }

    public static Specification<Rider> search(String tenantId,
            String keyword,
            RiderStatus status,
            RiderType riderType,
            Boolean wheelchairRequired,
            Boolean escortRequired) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("riderCode")), pattern),
                        builder.like(builder.lower(root.get("firstName")), pattern),
                        builder.like(builder.lower(root.get("lastName")), pattern),
                        builder.like(builder.lower(root.get("email")), pattern),
                        builder.like(builder.lower(root.get("primaryPhone")), pattern),
                        builder.like(builder.lower(root.get("alternatePhone")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (riderType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("riderType"), riderType));
            }
            if (wheelchairRequired != null) {
                predicate = builder.and(predicate, builder.equal(root.get("wheelchairRequired"), wheelchairRequired));
            }
            if (escortRequired != null) {
                predicate = builder.and(predicate, builder.equal(root.get("escortRequired"), escortRequired));
            }
            return predicate;
        };
    }
}