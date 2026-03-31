package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class RouteSpecifications {

    private RouteSpecifications() {
    }

    public static Specification<Route> search(String tenantId,
            String keyword,
            RouteStatus status,
            ServiceType serviceType,
            LocalDate fromDate,
            LocalDate toDate,
            Long driverId) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("routeCode")), pattern),
                        builder.like(builder.lower(root.get("routeName")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (serviceType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("serviceType"), serviceType));
            }
            if (fromDate != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("routeDate"), fromDate));
            }
            if (toDate != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("routeDate"), toDate));
            }
            if (driverId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("assignedDriverId"), driverId));
            }
            return predicate;
        };
    }
}