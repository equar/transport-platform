package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.api.response.*;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Aggregate projections keep financial history out of the persistence context and heap. */
@Service
public class ReceivablesQueries {
    private final JdbcTemplate db;
    public ReceivablesQueries(JdbcTemplate db) { this.db = db; }
    public BigDecimal collected(String tenant) {
        return db.queryForObject("SELECT COALESCE(SUM(amount-COALESCE(refunded_amount,0)),0) FROM payments WHERE tenant_id=? AND payment_method<>'CREDIT_NOTE' AND status IN ('APPLIED','PARTIALLY_APPLIED','PARTIALLY_REFUNDED','REFUNDED')", BigDecimal.class, tenant);
    }
    public ReceivablesSummaryResponse summary(String tenant, LocalDate today) {
        var totals = db.queryForMap("SELECT COALESCE(SUM(CASE WHEN status NOT IN ('DRAFT','VOID') AND balance_due>0 THEN balance_due ELSE 0 END),0) AS outstanding, COALESCE(SUM(CASE WHEN status NOT IN ('DRAFT','VOID') AND balance_due>0 AND due_date<? THEN balance_due ELSE 0 END),0) AS overdue, COALESCE(SUM(status NOT IN ('DRAFT','VOID') AND balance_due>0 AND due_date<?),0) AS overdue_count, COALESCE(SUM(status='PARTIALLY_PAID'),0) AS partial_count FROM invoices WHERE tenant_id=?", today, today, tenant);
        var buckets = new EnumMap<InvoiceAgingBucket, AgingBucketSummaryResponse>(InvoiceAgingBucket.class);
        for (var bucket : InvoiceAgingBucket.values()) buckets.put(bucket, new AgingBucketSummaryResponse(bucket, 0, BigDecimal.ZERO.setScale(2)));
        db.query("SELECT CASE WHEN due_date IS NULL OR due_date>=? THEN 'CURRENT' WHEN DATEDIFF(?,due_date)<=30 THEN 'DAYS_1_TO_30' WHEN DATEDIFF(?,due_date)<=60 THEN 'DAYS_31_TO_60' WHEN DATEDIFF(?,due_date)<=90 THEN 'DAYS_61_TO_90' ELSE 'DAYS_90_PLUS' END AS bucket,COUNT(*) AS records,SUM(balance_due) AS amount FROM invoices WHERE tenant_id=? AND status NOT IN ('DRAFT','VOID') AND balance_due>0 GROUP BY bucket", row -> {
            var bucket = InvoiceAgingBucket.valueOf(row.getString("bucket"));
            buckets.put(bucket, new AgingBucketSummaryResponse(bucket, row.getLong("records"), row.getBigDecimal("amount")));
        }, today, today, today, today, tenant);
        return new ReceivablesSummaryResponse(db.queryForObject("SELECT COUNT(*) FROM payments WHERE tenant_id=?", Long.class, tenant), collected(tenant), (BigDecimal)totals.get("outstanding"), ((Number)totals.get("overdue_count")).longValue(), (BigDecimal)totals.get("overdue"), ((Number)totals.get("partial_count")).longValue(), List.copyOf(buckets.values()));
    }
}
