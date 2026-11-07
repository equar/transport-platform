package com.transportplatform.tms.features.settings.application;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.features.settings.domain.*;
import java.time.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class TenantTimeServiceTest {
    @Test void financialDayUsesTenantMidnightIncludingDst() {
        TenantSettingsRepository repository = mock(TenantSettingsRepository.class);
        TenantSettings settings = new TenantSettings(); settings.setTimezone("America/New_York");
        when(repository.findById("tenant")).thenReturn(Optional.of(settings));
        assertEquals(LocalDate.of(2026, 11, 6), new TenantTimeService(repository,
                Clock.fixed(Instant.parse("2026-11-07T02:00:00Z"), ZoneOffset.UTC)).today("tenant"));
        assertEquals(LocalDate.of(2026, 3, 7), new TenantTimeService(repository,
                Clock.fixed(Instant.parse("2026-03-08T04:59:00Z"), ZoneOffset.UTC)).today("tenant"));
    }
}
