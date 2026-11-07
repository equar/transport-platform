package com.transportplatform.tms.common.observability;

import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicLong;
import java.sql.Timestamp;
import java.time.Clock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OperationalMetrics {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final AtomicLong pushPending=new AtomicLong(), pushFailed=new AtomicLong(), exportsPending=new AtomicLong(), staleTrips=new AtomicLong();
    public OperationalMetrics(JdbcTemplate jdbc, Clock clock, MeterRegistry registry) {
        this.jdbc=jdbc;this.clock=clock;
        registry.gauge("transport.push.pending",pushPending);
        registry.gauge("transport.push.failed",pushFailed);
        registry.gauge("transport.exports.pending",exportsPending);
        registry.gauge("transport.tracking.stale",staleTrips);
    }
    @Scheduled(fixedDelayString="${app.operational-metrics.fixed-delay:PT1M}")
    public void update() {
        staleTrips.set(jdbc.queryForObject("SELECT COUNT(*) FROM rides r WHERE r.status IN ('DRIVER_EN_ROUTE','ARRIVED','PICKED_UP','DROPPED_OFF') AND NOT EXISTS (SELECT 1 FROM driver_location_snapshots s WHERE s.tenant_id=r.tenant_id AND s.ride_id=r.id AND s.captured_at>=?)",Long.class,Timestamp.from(clock.instant().minusSeconds(120))));
        pushPending.set(jdbc.queryForObject("SELECT COUNT(*) FROM push_delivery_jobs WHERE status IN ('PENDING','SENDING','ACCEPTED') OR (status='FAILED' AND next_attempt_at IS NOT NULL)",Long.class));
        pushFailed.set(jdbc.queryForObject("SELECT COUNT(*) FROM push_delivery_jobs WHERE status='FAILED' AND next_attempt_at IS NULL",Long.class));
        exportsPending.set(jdbc.queryForObject("SELECT COUNT(*) FROM report_export_jobs WHERE status IN ('PENDING','RUNNING') AND expires_at>?",Long.class,Timestamp.from(clock.instant())));
    }
}
