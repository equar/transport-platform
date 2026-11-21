package com.transportplatform.tms.common.security;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.HexFormat;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** One shared request budget across replicas; a database outage never fails open. */
@Service
public class DistributedAuthRateLimit {
    private final JdbcTemplate db;
    private final Clock clock;
    public DistributedAuthRateLimit(JdbcTemplate db, Clock clock) { this.db=db; this.clock=clock; }
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public long retryAfter(String key, int limit, Duration window, Instant now) {
        String hash;
        try { hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
        db.update("INSERT INTO auth_rate_windows(key_hash,window_started_at,requests,expires_at) VALUES(?,?,0,?) ON DUPLICATE KEY UPDATE requests=auth_rate_windows.requests",hash,utc(now),utc(now.plus(window)));
        var row=db.queryForMap("SELECT * FROM auth_rate_windows WHERE key_hash=? FOR UPDATE",hash);
        Object stored = row.get("window_started_at");
        Instant start=stored instanceof LocalDateTime local ? local.toInstant(ZoneOffset.UTC) : ((Timestamp)stored).toInstant();
        long count=((Number)row.get("requests")).longValue();
        if(!start.plus(window).isAfter(now)) {start=now;count=0;}
        count=Math.min(count+1, (long)limit+1);
        db.update("UPDATE auth_rate_windows SET requests=?,window_started_at=?,expires_at=? WHERE key_hash=?",count,utc(start),utc(start.plus(window)),hash);
        return count<=limit?0:Math.max(1,Duration.between(now,start.plus(window)).toSeconds());
    }
    @Scheduled(fixedDelayString="${app.security.auth-rate-limit.cleanup-delay:PT1H}")
    public void cleanup() {db.update("DELETE FROM auth_rate_windows WHERE expires_at<? LIMIT 10000",utc(clock.instant()));}
    private static java.time.LocalDateTime utc(Instant instant) { return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneOffset.UTC); }

}
