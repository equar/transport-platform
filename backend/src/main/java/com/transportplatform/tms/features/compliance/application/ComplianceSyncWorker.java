package com.transportplatform.tms.features.compliance.application;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ComplianceSyncWorker {
    private final JdbcTemplate db;
    private final ComplianceIssueSyncService service;

    public ComplianceSyncWorker(JdbcTemplate db, ComplianceIssueSyncService service) {
        this.db = db;
        this.service = service;
    }

    @Scheduled(
            fixedDelayString = "${app.compliance.sync.interval-ms:300000}",
            initialDelayString = "${app.compliance.sync.initial-delay-ms:60000}")
    public void run() {
        String cursor = "";
        while (true) {
            var ids =
                    db.queryForList(
                            "SELECT id FROM tenants WHERE id>? AND status='ACTIVE' ORDER BY id"
                                    + " LIMIT 100",
                            String.class,
                            cursor);
            if (ids.isEmpty()) return;
            for (String id : ids) {
                cursor = id;
                try {
                    service.synchronizeTenantIssues(id);
                } catch (RuntimeException e) {
                    org.slf4j.LoggerFactory.getLogger(getClass())
                            .warn("Compliance synchronization failed; record contents omitted.");
                }
            }
        }
    }
}
