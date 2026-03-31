package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import org.springframework.data.jpa.domain.Specification;

public final class SubscriptionPlanSpecifications {

    private SubscriptionPlanSpecifications() {
    }

    public static Specification<SubscriptionPlan> search(String keyword,
            SubscriptionPlanStatus status,
            SubscriptionPlanTier tier) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("planCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (tier != null) {
                predicate = builder.and(predicate, builder.equal(root.get("tier"), tier));
            }
            return predicate;
        };
    }
}