package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import org.springframework.data.jpa.domain.Specification;

public final class VehicleDocumentSpecifications {

    private VehicleDocumentSpecifications() {
    }

    public static Specification<VehicleDocument> search(String tenantId,
            Long vehicleId,
            VehicleDocumentType documentType,
            VehicleDocumentVerificationStatus verificationStatus,
            VehicleDocumentStatus status) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (vehicleId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("vehicle").get("id"), vehicleId));
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