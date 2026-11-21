package com.transportplatform.tms.features.ride.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.rideevent.application.RideEventService;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

class RideJourneyQuoteTest {
    @Test
    void splitPreservesTotalQuoteIncludingOddCentsAndDoesNotSplitTwice() {
        var repository = mock(RideRepository.class);
        var codes = mock(RideCodeGenerator.class);
        var service =
                new RideJourneyService(
                        repository,
                        codes,
                        mock(RideEventService.class),
                        mock(AuditLogService.class));
        var outbound = new Ride();
        ReflectionTestUtils.setField(outbound, "id", 1L);
        outbound.setTenantId("tenant");
        outbound.setRideNumber("OUT");
        outbound.setTripType(RideTripType.ROUND_TRIP);
        outbound.setStatus(RideStatus.SCHEDULED);
        outbound.setReturnPickupAt(LocalDateTime.of(2026, 11, 20, 12, 0));
        outbound.setReturnDropoffAt(LocalDateTime.of(2026, 11, 20, 13, 0));
        outbound.setQuotedPrice(new BigDecimal("125.01"));
        when(codes.generate("tenant")).thenReturn("BACK");
        when(repository.saveAndFlush(any()))
                .thenAnswer(
                        call -> {
                            Ride ride = call.getArgument(0);
                            if (ride.getId() == null) ReflectionTestUtils.setField(ride, "id", 2L);
                            return ride;
                        });
        service.split(outbound);
        var saved = ArgumentCaptor.forClass(Ride.class);
        verify(repository, times(3)).saveAndFlush(saved.capture());
        Ride back = saved.getAllValues().get(1);
        assertThat(outbound.getQuotedPrice()).isEqualByComparingTo("62.51");
        assertThat(back.getQuotedPrice()).isEqualByComparingTo("62.50");
        assertThat(outbound.getQuotedPrice().add(back.getQuotedPrice()))
                .isEqualByComparingTo("125.01");
        service.split(outbound);
        verify(repository, times(3)).saveAndFlush(any());
    }
}
