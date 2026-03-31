package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.features.compliance.domain.ComplianceEntityType;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class ComplianceIssueSpecifications {

    private ComplianceIssueSpecifications() {
    }

    public static Specification<ComplianceIssue> search(String tenantId,
            String keyword,
            ComplianceEntityType entityType,
            ComplianceIssueType issueType,
            ComplianceIssueSeverity severity,
            ComplianceIssueStatus issueStatus,
            Boolean expiredOnly,
            Boolean expiringSoonOnly,
            LocalDate expiryFrom,
            LocalDate expiryTo,
            LocalDate today,
            LocalDate expiringSoonDate) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("entityCode")), pattern),
                        builder.like(builder.lower(root.get("entityNameSummary")), pattern),
                        builder.like(builder.lower(root.get("summary")), pattern),
                        builder.like(builder.lower(root.get("relatedDocumentType")), pattern)));
            }
            if (entityType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("entityType"), entityType));
            }
            if (issueType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("issueType"), issueType));
            }
            if (severity != null) {
                predicate = builder.and(predicate, builder.equal(root.get("severity"), severity));
            }
            if (issueStatus != null) {
                predicate = builder.and(predicate, builder.equal(root.get("issueStatus"), issueStatus));
            }
            if (expiryFrom != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("expiryDate"), expiryFrom));
            }
            if (expiryTo != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("expiryDate"), expiryTo));
            }
            if (Boolean.TRUE.equals(expiredOnly)) {
                predicate = builder.and(predicate, builder.isNotNull(root.get("expiryDate")));
                predicate = builder.and(predicate, builder.lessThan(root.get("expiryDate"), today));
            }
            if (Boolean.TRUE.equals(expiringSoonOnly)) {
                predicate = builder.and(predicate, builder.isNotNull(root.get("expiryDate")));
                predicate = builder.and(predicate, builder.between(root.get("expiryDate"), today, expiringSoonDate));
            }
            return predicate;
        };
    }
}