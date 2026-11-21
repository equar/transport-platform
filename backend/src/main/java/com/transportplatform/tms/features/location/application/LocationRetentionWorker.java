package com.transportplatform.tms.features.location.application;

import com.transportplatform.tms.features.privacy.application.PrivacyRetentionService;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LocationRetentionWorker {
    private final JdbcTemplate db;
    private final PrivacyRetentionService retention;

    public LocationRetentionWorker(JdbcTemplate db, PrivacyRetentionService retention) {
        this.db = db;
        this.retention = retention;
    }

    @Scheduled(
            fixedDelayString = "${app.location.retention.interval-ms:60000}",
            initialDelayString = "${app.location.retention.initial-delay-ms:120000}")
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
                    for (int batch = 0; batch < 20; batch++)
                        if (retention.cleanLocations(tenant) < 1000) break;
                } catch (RuntimeException e) {
                    org.slf4j.LoggerFactory.getLogger(getClass())
                            .warn("GPS retention cleanup failed; coordinates omitted.");
                }
            }
        }
    }
}
