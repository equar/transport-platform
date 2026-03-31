package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import org.springframework.data.jpa.domain.Specification;

public final class OrganizationSpecifications {

    private OrganizationSpecifications() {
    }

    public static Specification<Organization> search(String tenantId,
            String keyword,
            OrganizationStatus status,
            OrganizationType organizationType) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("organizationCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("legalName")), pattern),
                        builder.like(builder.lower(root.get("primaryEmail")), pattern),
                        builder.like(builder.lower(root.get("primaryPhone")), pattern),
                        builder.like(builder.lower(root.get("city")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (organizationType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("organizationType"), organizationType));
            }
            return predicate;
        };
    }
}