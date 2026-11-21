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
            Boolean escortRequired, com.transportplatform.tms.common.privacy.PhiCipher privacy) {
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
                        keyword.replaceAll("[^0-9]", "").length() >= 3
                            ? builder.isMember(privacy.lookup(tenantId,"phone",keyword.replaceAll("[^0-9]", "")),root.get("privatePhoneTokens"))
                            : builder.disjunction()));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (riderType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("riderType"), riderType));
            }
            if (wheelchairRequired != null) {
                predicate = builder.and(predicate, builder.equal(root.get("wheelchairLookup"), privacy.lookup(tenantId,"wheelchair",wheelchairRequired.toString())));
            }
            if (escortRequired != null) {
                predicate = builder.and(predicate, builder.equal(root.get("escortLookup"), privacy.lookup(tenantId,"escort",escortRequired.toString())));
            }
            return predicate;
        };
    }
}