package com.transportplatform.tms.features.settings.application;

import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Component;

@Component
public class TenantTimeService {
    private final TenantSettingsRepository settings;
    private final Clock clock;

    public TenantTimeService(TenantSettingsRepository settings, Clock clock) {
        this.settings = settings;
        this.clock = clock;
    }

    public java.time.LocalDateTime now(String tenantId) {
        return java.time.LocalDateTime.now(clock.withZone(zone(tenantId)));
    }

    private ZoneId zone(String tenantId) {
        return ZoneId.of(settings.findById(tenantId).map(s -> s.getTimezone()).orElse("UTC"));
    }

    public LocalDate today(String tenantId) {
        ZoneId zone = zone(tenantId);
        return LocalDate.now(clock.withZone(zone));
    }
}
