package com.transportplatform.tms.common.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class InMemoryRequestRateLimiter {

    private static final int CLEANUP_INTERVAL = 256;

    private final Clock clock;
    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final AtomicInteger requestCounter = new AtomicInteger();

    public InMemoryRequestRateLimiter() {
        this(Clock.systemUTC());
    }

    InMemoryRequestRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public RateLimitDecision tryConsume(String bucketKey, SecurityProperties.Policy policy) {
        Instant now = clock.instant();
        Duration window = policy.getWindow();
        int capacity = policy.getCapacity();

        WindowCounter counter = counters.compute(bucketKey, (key, existing) -> {
            if (existing == null || existing.expiresAt().isBefore(now) || existing.expiresAt().equals(now)) {
                return new WindowCounter(1, now.plus(window));
            }
            return new WindowCounter(existing.count() + 1, existing.expiresAt());
        });

        maybeCleanup(now);

        int remaining = Math.max(capacity - counter.count(), 0);
        return new RateLimitDecision(counter.count() <= capacity, remaining, counter.expiresAt());
    }

    private void maybeCleanup(Instant now) {
        if (requestCounter.incrementAndGet() % CLEANUP_INTERVAL != 0) {
            return;
        }

        Iterator<Map.Entry<String, WindowCounter>> iterator = counters.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, WindowCounter> entry = iterator.next();
            if (!entry.getValue().expiresAt().isAfter(now)) {
                iterator.remove();
            }
        }
    }

    public record RateLimitDecision(boolean allowed, int remaining, Instant resetAt) {
    }

    private record WindowCounter(int count, Instant expiresAt) {
    }
}