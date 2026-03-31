package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

public final class IncidentSpecifications {

    private IncidentSpecifications() {
    }

    public static Specification<Incident> search(String tenantId,
            String keyword,
            IncidentStatus status,
            IncidentSeverity severity,
            IncidentType incidentType,
            Long assignedToUserId,
            Instant fromReportedAt,
            Instant toReportedAt) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("incidentCode")), pattern),
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern),
                        builder.like(builder.lower(root.get("reportedByNameSnapshot")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (severity != null) {
                predicate = builder.and(predicate, builder.equal(root.get("severity"), severity));
            }
            if (incidentType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("incidentType"), incidentType));
            }
            if (assignedToUserId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("assignedToUserId"), assignedToUserId));
            }
            if (fromReportedAt != null) {
                predicate = builder.and(predicate,
                        builder.greaterThanOrEqualTo(root.get("reportedAt"), fromReportedAt));
            }
            if (toReportedAt != null) {
                predicate = builder.and(predicate, builder.lessThan(root.get("reportedAt"), toReportedAt));
            }
            return predicate;
        };
    }
}