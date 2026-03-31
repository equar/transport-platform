package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class PaymentSpecifications {

    private PaymentSpecifications() {
    }

    public static Specification<Payment> search(String tenantId,
            String keyword,
            PaymentStatus status,
            PaymentMethod paymentMethod,
            LocalDate fromDate,
            LocalDate toDate) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            var invoiceJoin = root.join("invoice");
            if (tenantId != null && !tenantId.isBlank()) {
                predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("paymentNumber")), pattern),
                        builder.like(builder.lower(root.get("referenceNumber")), pattern),
                        builder.like(builder.lower(root.get("payerName")), pattern),
                        builder.like(builder.lower(invoiceJoin.get("invoiceNumber")), pattern),
                        builder.like(builder.lower(invoiceJoin.get("billToNameSnapshot")), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (paymentMethod != null) {
                predicate = builder.and(predicate, builder.equal(root.get("paymentMethod"), paymentMethod));
            }
            if (fromDate != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("paymentDate"), fromDate));
            }
            if (toDate != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("paymentDate"), toDate));
            }
            return predicate;
        };
    }
}