package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.domain.FeatureFlag;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import org.springframework.data.jpa.domain.Specification;

public final class FeatureFlagSpecifications {

    private FeatureFlagSpecifications() {
    }

    public static Specification<FeatureFlag> search(String keyword, FeatureFlagStatus status, String moduleKey) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("flagCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("moduleKey")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (moduleKey != null && !moduleKey.isBlank()) {
                predicate = builder.and(predicate,
                        builder.equal(builder.lower(root.get("moduleKey")), moduleKey.trim().toLowerCase()));
            }
            return predicate;
        };
    }
}