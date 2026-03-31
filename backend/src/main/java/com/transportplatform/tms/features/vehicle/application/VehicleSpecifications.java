package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import org.springframework.data.jpa.domain.Specification;

public final class VehicleSpecifications {

    private VehicleSpecifications() {
    }

    public static Specification<Vehicle> search(String tenantId,
            String keyword,
            VehicleStatus status,
            VehicleOwnershipType ownershipType,
            String serviceType) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("vehicleCode")), pattern),
                        builder.like(builder.lower(root.get("make")), pattern),
                        builder.like(builder.lower(root.get("model")), pattern),
                        builder.like(builder.lower(root.get("vin")), pattern),
                        builder.like(builder.lower(root.get("plateNumber")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (ownershipType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("ownershipType"), ownershipType));
            }
            if (serviceType != null && !serviceType.isBlank()) {
                query.distinct(true);
                var join = root.joinSet("serviceTypesSupported");
                predicate = builder.and(predicate,
                        builder.equal(builder.upper(join.as(String.class)), serviceType.trim().toUpperCase()));
            }
            return predicate;
        };
    }
}