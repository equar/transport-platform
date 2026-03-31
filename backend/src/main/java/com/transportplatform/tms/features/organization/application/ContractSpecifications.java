package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.domain.BillingModel;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class ContractSpecifications {

    private ContractSpecifications() {
    }

    public static Specification<Contract> search(String tenantId,
            String keyword,
            ContractStatus status,
            ContractType contractType,
            BillingModel billingModel,
            LocalDate today) {
        return (root, query, builder) -> {
            query.distinct(true);
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                var organization = root.join("organization");
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("contractCode")), pattern),
                        builder.like(builder.lower(root.get("contractName")), pattern),
                        builder.like(builder.lower(organization.get("name")), pattern)));
            }
            if (status != null) {
                if (status == ContractStatus.EXPIRED) {
                    predicate = builder.and(predicate,
                            builder.or(
                                    builder.equal(root.get("status"), ContractStatus.ACTIVE),
                                    builder.equal(root.get("status"), ContractStatus.SUSPENDED)),
                            builder.isNotNull(root.get("endDate")),
                            builder.lessThan(root.get("endDate"), today));
                } else {
                    predicate = builder.and(predicate, builder.equal(root.get("status"), status));
                    if (status == ContractStatus.ACTIVE || status == ContractStatus.SUSPENDED) {
                        predicate = builder.and(predicate, builder.or(
                                builder.isNull(root.get("endDate")),
                                builder.greaterThanOrEqualTo(root.get("endDate"), today)));
                    }
                }
            }
            if (contractType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("contractType"), contractType));
            }
            if (billingModel != null) {
                predicate = builder.and(predicate, builder.equal(root.get("billingModel"), billingModel));
            }
            return predicate;
        };
    }
}