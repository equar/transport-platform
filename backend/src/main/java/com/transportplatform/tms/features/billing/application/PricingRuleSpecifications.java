package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class PricingRuleSpecifications {

    private PricingRuleSpecifications() {
    }

    public static Specification<PricingRule> search(String tenantId,
            String keyword,
            PricingRuleStatus status,
            PricingModel pricingModel,
            BillToType billToType,
            ServiceType serviceType,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            LocalDate today) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("pricingRuleCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)));
            }
            if (status != null) {
                if (status == PricingRuleStatus.EXPIRED) {
                    predicate = builder.and(predicate,
                            builder.or(
                                    builder.equal(root.get("status"), PricingRuleStatus.ACTIVE),
                                    builder.equal(root.get("status"), PricingRuleStatus.SUSPENDED)),
                            builder.isNotNull(root.get("effectiveEndDate")),
                            builder.lessThan(root.get("effectiveEndDate"), today));
                } else {
                    predicate = builder.and(predicate, builder.equal(root.get("status"), status));
                    if (status == PricingRuleStatus.ACTIVE || status == PricingRuleStatus.SUSPENDED) {
                        predicate = builder.and(predicate,
                                builder.or(
                                        builder.isNull(root.get("effectiveEndDate")),
                                        builder.greaterThanOrEqualTo(root.get("effectiveEndDate"), today)));
                    }
                }
            }
            if (pricingModel != null) {
                predicate = builder.and(predicate, builder.equal(root.get("pricingModel"), pricingModel));
            }
            if (billToType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("billToType"), billToType));
            }
            if (serviceType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("serviceType"), serviceType));
            }
            if (effectiveFrom != null) {
                predicate = builder.and(predicate,
                        builder.or(
                                builder.isNull(root.get("effectiveEndDate")),
                                builder.greaterThanOrEqualTo(root.get("effectiveEndDate"), effectiveFrom)));
            }
            if (effectiveTo != null) {
                predicate = builder.and(predicate,
                        builder.lessThanOrEqualTo(root.get("effectiveStartDate"), effectiveTo));
            }
            return predicate;
        };
    }

    public static Specification<PricingRule> activeCandidates(String tenantId, BillToType billToType, LocalDate date) {
        return (root, query, builder) -> builder.and(
                builder.equal(root.get("tenantId"), tenantId),
                builder.equal(root.get("billToType"), billToType),
                builder.equal(root.get("status"), PricingRuleStatus.ACTIVE),
                builder.lessThanOrEqualTo(root.get("effectiveStartDate"), date),
                builder.or(
                        builder.isNull(root.get("effectiveEndDate")),
                        builder.greaterThanOrEqualTo(root.get("effectiveEndDate"), date)));
    }
}
