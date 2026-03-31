package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class RideSpecifications {

    private RideSpecifications() {
    }

    public static Specification<Ride> search(String tenantId,
            String keyword,
            RideStatus status,
            ServiceType serviceType,
            RideTripType tripType,
            Long riderId,
            Long organizationId,
            Long contractId,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            Boolean recurringOnly) {
        return search(tenantId, keyword, status, serviceType, tripType, riderId, organizationId, contractId,
                fromDateTime, toDateTime, null, recurringOnly);
    }

    public static Specification<Ride> search(String tenantId,
            String keyword,
            RideStatus status,
            ServiceType serviceType,
            RideTripType tripType,
            Long riderId,
            Long organizationId,
            Long contractId,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            Long driverId,
            Boolean recurringOnly) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                query.distinct(true);
                var riderJoin = root.join("rider");
                var organizationJoin = root.join("organization", jakarta.persistence.criteria.JoinType.LEFT);
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("rideNumber")), pattern),
                        builder.like(builder.lower(riderJoin.get("riderCode")), pattern),
                        builder.like(builder.lower(riderJoin.get("firstName")), pattern),
                        builder.like(builder.lower(riderJoin.get("lastName")), pattern),
                        builder.like(builder.lower(organizationJoin.get("name")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (serviceType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("serviceType"), serviceType));
            }
            if (tripType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("tripType"), tripType));
            }
            if (riderId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("rider").get("id"), riderId));
            }
            if (organizationId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("organization").get("id"), organizationId));
            }
            if (contractId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("contract").get("id"), contractId));
            }
            if (driverId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("driverId"), driverId));
            }
            if (fromDateTime != null) {
                predicate = builder.and(predicate,
                        builder.greaterThanOrEqualTo(root.get("scheduledPickupAt"), fromDateTime));
            }
            if (toDateTime != null) {
                predicate = builder.and(predicate,
                        builder.lessThanOrEqualTo(root.get("scheduledPickupAt"), toDateTime));
            }
            if (recurringOnly != null) {
                predicate = recurringOnly
                        ? builder.and(predicate, builder.isNotNull(root.get("recurrenceSchedule")))
                        : builder.and(predicate, builder.isNull(root.get("recurrenceSchedule")));
            }
            return predicate;
        };
    }
}