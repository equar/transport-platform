package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceAreaCoverageType;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
import org.springframework.data.jpa.domain.Specification;

public final class ServiceAreaSpecifications {

    private ServiceAreaSpecifications() {
    }

    public static Specification<ServiceArea> search(String tenantId,
            String keyword,
            ServiceAreaStatus status,
            ServiceAreaCoverageType coverageType) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("areaCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("city")), pattern),
                        builder.like(builder.lower(root.get("zipCode")), pattern),
                        builder.like(builder.lower(root.get("county")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (coverageType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("coverageType"), coverageType));
            }
            return predicate;
        };
    }
}