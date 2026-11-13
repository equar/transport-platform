package com.transportplatform.tms.features.ride.application;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.common.exception.ApiException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class TenantScheduleTest {
    @Test void rejectsBothMissingAndAmbiguousDaylightSavingTimes() {
        var settings=mock(TenantSettingsRepository.class);var tenant=new TenantSettings();tenant.setTimezone("America/New_York");tenant.setAllowManualRideCreation(true);tenant.setAllowRoundTripRides(true);
        when(settings.findById("a")).thenReturn(Optional.of(tenant));
        var validator=new RideScheduleValidator(settings);var request=mock(RideUpsertRequest.class);
        when(request.scheduledPickupAt()).thenReturn(LocalDateTime.of(2026,3,8,2,30));
        assertThrows(ApiException.class,()->validator.validate("a",request));
        when(request.scheduledPickupAt()).thenReturn(LocalDateTime.of(2026,11,1,1,30));
        assertThrows(ApiException.class,()->validator.validate("a",request));
        when(request.scheduledPickupAt()).thenReturn(LocalDateTime.of(2026,11,1,3,30));
        assertDoesNotThrow(()->validator.validate("a",request));
    }
}
