package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.settings.application.TenantTimeService;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InvoiceAgingWorker {
    private final JdbcTemplate db;
    private final TenantTimeService time;

    public InvoiceAgingWorker(JdbcTemplate db, TenantTimeService time) {
        this.db = db;
        this.time = time;
    }

    @Scheduled(
            fixedDelayString = "${app.billing.aging.interval-ms:900000}",
            initialDelayString = "${app.billing.aging.initial-delay-ms:90000}")
    public void run() {
        String cursor = "";
        while (true) {
            var tenants =
                    db.queryForList(
                            "SELECT id FROM tenants WHERE id>? ORDER BY id LIMIT 100",
                            String.class,
                            cursor);
            if (tenants.isEmpty()) return;
            for (String tenant : tenants) {
                cursor = tenant;
                try {
                    reconcile(tenant);
                } catch (RuntimeException e) {
                    org.slf4j.LoggerFactory.getLogger(getClass())
                            .warn("Invoice aging reconciliation failed; contents omitted.");
                }
            }
        }
    }

    public void reconcile(String tenant) {
        db.update(
                "UPDATE invoices SET status=CASE WHEN balance_due<=0 THEN 'PAID' WHEN due_date<?"
                    + " THEN 'OVERDUE' WHEN amount_paid>0 THEN 'PARTIALLY_PAID' ELSE 'ISSUED' END"
                    + " WHERE tenant_id=? AND status IN ('ISSUED','PARTIALLY_PAID','OVERDUE')",
                time.today(tenant),
                tenant);
    }
}
