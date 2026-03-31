package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import org.springframework.data.jpa.domain.Specification;

public final class CompanyApplicationSpecifications {

    private CompanyApplicationSpecifications() {
    }

    public static Specification<CompanyApplication> search(String keyword, CompanyApplicationStatus status) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(
                        predicate,
                        builder.or(
                                builder.like(builder.lower(root.get("applicationNumber")), pattern),
                                builder.like(builder.lower(root.get("legalCompanyName")), pattern),
                                builder.like(builder.lower(root.get("contactFirstName")), pattern),
                                builder.like(builder.lower(root.get("contactLastName")), pattern),
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
