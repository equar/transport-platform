package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.domain.SubscriptionPlanTier;
import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TenantSubscriptionSpecifications {

    private TenantSubscriptionSpecifications() {
    }

    public static Specification<TenantSubscription> search(String keyword,
            TenantSubscriptionStatus status,
            SubscriptionPlanTier planTier,
            Boolean trial) {
        return (root, query, builder) -> {
            query.distinct(true);
            var tenantJoin = root.join("tenant");
            var planJoin = root.join("subscriptionPlan");
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(tenantJoin.get("tenantCode")), pattern),
                        builder.like(builder.lower(tenantJoin.get("companyName")), pattern),
                        builder.like(builder.lower(planJoin.get("planCode")), pattern),
                        builder.like(builder.lower(planJoin.get("name")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (planTier != null) {
                predicate = builder.and(predicate, builder.equal(planJoin.get("tier"), planTier));
            }
            if (trial != null) {
                predicate = builder.and(predicate, builder.equal(root.get("trial"), trial));
            }
            return predicate;
        };
    }
}