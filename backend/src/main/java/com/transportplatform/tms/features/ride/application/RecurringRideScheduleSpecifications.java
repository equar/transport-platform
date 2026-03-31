package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RecurringRideSchedule;
import com.transportplatform.tms.features.ride.domain.RideRecurrencePatternType;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class RecurringRideScheduleSpecifications {

    private RecurringRideScheduleSpecifications() {
    }

    public static Specification<RecurringRideSchedule> search(String tenantId,
            String keyword,
            RideRecurrenceStatus status,
            ServiceType serviceType,
            RideTripType tripType,
            RideRecurrencePatternType recurrencePatternType,
            Long riderId,
            Long organizationId,
            Long contractId,
            LocalDate fromDate,
            LocalDate toDate) {
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
                        builder.like(builder.lower(root.get("recurrenceCode")), pattern),
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
            if (recurrencePatternType != null) {
                predicate = builder.and(predicate,
                        builder.equal(root.get("recurrencePatternType"), recurrencePatternType));
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
            if (fromDate != null) {
                predicate = builder.and(predicate,
                        builder.or(builder.isNull(root.get("endDate")),
                                builder.greaterThanOrEqualTo(root.get("endDate"), fromDate)));
            }
            if (toDate != null) {
                predicate = builder.and(predicate,
                        builder.lessThanOrEqualTo(root.get("startDate"), toDate));
            }
            return predicate;
        };
    }
}