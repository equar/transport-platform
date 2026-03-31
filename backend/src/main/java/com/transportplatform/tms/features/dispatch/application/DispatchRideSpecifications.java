package com.transportplatform.tms.features.dispatch.application;

import com.transportplatform.tms.features.dispatch.application.DispatchRideView;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import jakarta.persistence.criteria.JoinType;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class DispatchRideSpecifications {

    private DispatchRideSpecifications() {
    }

    public static Specification<Ride> search(String tenantId,
            String keyword,
            DispatchRideView view,
            RideStatus status,
            ServiceType serviceType,
            Long driverId,
            Long vehicleId,
            Long organizationId,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            String normalizedKeyword = keyword == null ? "" : keyword.trim();
            if (!normalizedKeyword.isEmpty()) {
                String pattern = "%" + normalizedKeyword.toLowerCase() + "%";
                var rider = root.join("rider", JoinType.LEFT);
                var organization = root.join("organization", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("rideNumber")), pattern),
                        cb.like(cb.lower(rider.get("riderCode")), pattern),
                        cb.like(cb.lower(rider.get("firstName")), pattern),
                        cb.like(cb.lower(rider.get("lastName")), pattern),
                        cb.like(cb.lower(organization.get("name")), pattern),
                        cb.like(cb.lower(root.get("pickupAddressLine1")), pattern),
                        cb.like(cb.lower(root.get("dropoffAddressLine1")), pattern)));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (serviceType != null) {
                predicates.add(cb.equal(root.get("serviceType"), serviceType));
            }
            if (driverId != null) {
                predicates.add(cb.equal(root.get("driverId"), driverId));
            }
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicleId"), vehicleId));
            }
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }
            if (fromDateTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("scheduledPickupAt"), fromDateTime));
            }
            if (toDateTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("scheduledPickupAt"), toDateTime));
            }
            if (view == DispatchRideView.UNASSIGNED) {
                predicates.add(cb.or(cb.isNull(root.get("driverId")), cb.isNull(root.get("vehicleId"))));
            } else if (view == DispatchRideView.ASSIGNED) {
                predicates.add(cb.isNotNull(root.get("driverId")));
                predicates.add(cb.isNotNull(root.get("vehicleId")));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}