package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class InvoiceSpecifications {

    private InvoiceSpecifications() {
    }

    public static Specification<Invoice> search(String tenantId,
            String keyword,
            InvoiceStatus status,
            InvoiceAgingBucket agingBucket,
            BillToType billToType,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean overdueOnly,
            LocalDate today) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("invoiceNumber")), pattern),
                        builder.like(builder.lower(root.get("billToNameSnapshot")), pattern)));
            }
            if (status != null) {
                if (status == InvoiceStatus.OVERDUE) {
                    predicate = builder.and(predicate,
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                            builder.lessThan(root.get("dueDate"), today),
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO));
                } else {
                    predicate = builder.and(predicate, builder.equal(root.get("status"), status));
                }
            }
            if (agingBucket != null) {
                predicate = switch (agingBucket) {
                    case CURRENT -> builder.and(predicate,
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO),
                            builder.or(
                                    builder.isNull(root.get("dueDate")),
                                    builder.greaterThanOrEqualTo(root.get("dueDate"), today)),
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)));
                    case DAYS_1_TO_30 -> builder.and(predicate,
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO),
                            builder.between(root.get("dueDate"), today.minusDays(30), today.minusDays(1)));
                    case DAYS_31_TO_60 -> builder.and(predicate,
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO),
                            builder.between(root.get("dueDate"), today.minusDays(60), today.minusDays(31)));
                    case DAYS_61_TO_90 -> builder.and(predicate,
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO),
                            builder.between(root.get("dueDate"), today.minusDays(90), today.minusDays(61)));
                    case DAYS_90_PLUS -> builder.and(predicate,
                            root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                            builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO),
                            builder.lessThan(root.get("dueDate"), today.minusDays(90)));
                };
            }
            if (billToType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("billToType"), billToType));
            }
            if (fromDate != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("invoiceDate"), fromDate));
            }
            if (toDate != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("invoiceDate"), toDate));
            }
            if (Boolean.TRUE.equals(overdueOnly)) {
                predicate = builder.and(predicate,
                        root.get("status").in(List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)),
                        builder.lessThan(root.get("dueDate"), today),
                        builder.greaterThan(root.get("balanceDue"), BigDecimal.ZERO));
            }
            return predicate;
        };
    }
}
