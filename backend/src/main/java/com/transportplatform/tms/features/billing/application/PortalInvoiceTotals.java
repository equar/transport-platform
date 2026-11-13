package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.domain.*;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;

/** Database aggregates across the complete authorized ledger, grouped by currency. */
@Service
public class PortalInvoiceTotals {
    private final EntityManager em;
    public PortalInvoiceTotals(EntityManager em) { this.em = em; }
    public record Totals(long count, Map<String, BigDecimal> balances) {
        public BigDecimal singleCurrencyBalance() { return balances.size() == 1 ? balances.values().iterator().next() : BigDecimal.ZERO; }
    }
    public Totals calculate(String tenant, Long rider, Long guardian, List<Long> linkedRiders, Long organization) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createQuery(Object[].class); var invoice = query.from(Invoice.class);
        var scope = organization != null ? cb.equal(invoice.get("organizationId"), organization)
                : rider != null ? cb.equal(invoice.get("riderId"), rider)
                : guardian != null ? cb.or(cb.equal(invoice.get("guardianId"), guardian),
                    linkedRiders.isEmpty() ? cb.disjunction() : invoice.get("riderId").in(linkedRiders)) : cb.disjunction();
        query.multiselect(invoice.get("currency"), cb.count(invoice), cb.sum(invoice.<BigDecimal>get("balanceDue")))
                .where(cb.equal(invoice.get("tenantId"), tenant), scope,
                    cb.not(invoice.get("status").in(InvoiceStatus.DRAFT, InvoiceStatus.VOID)),
                    cb.greaterThan(invoice.get("balanceDue"), BigDecimal.ZERO))
                .groupBy(invoice.get("currency"));
        long count = 0; Map<String, BigDecimal> balances = new TreeMap<>();
        for (var row : em.createQuery(query).getResultList()) {
            count += ((Number) row[1]).longValue(); balances.put((String) row[0], (BigDecimal) row[2]);
        }
        return new Totals(count, Collections.unmodifiableMap(balances));
    }
}
