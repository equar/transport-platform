package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import org.springframework.data.jpa.domain.Specification;

public final class DriverDocumentSpecifications {

    private DriverDocumentSpecifications() {
    }

    public static Specification<DriverDocument> search(String tenantId,
            Long driverId,
            DriverDocumentType documentType,
            DriverDocumentVerificationStatus verificationStatus,
            DriverDocumentStatus status) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (driverId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("driver").get("id"), driverId));
            }
            if (documentType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("documentType"), documentType));
            }
            if (verificationStatus != null) {
                predicate = builder.and(predicate, builder.equal(root.get("verificationStatus"), verificationStatus));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            return predicate;
        };
    }
}