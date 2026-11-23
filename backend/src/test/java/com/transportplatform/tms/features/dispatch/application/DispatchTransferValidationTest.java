package com.transportplatform.tms.features.dispatch.application;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import com.transportplatform.tms.common.privacy.PhiCipher;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class DispatchTransferValidationTest {
    @Test void rejectsGeographicallyImpossibleTransfersAndKeepsMinimumTurnaround() {
        var service=new DispatchAssignmentValidationService(mock(RideRepository.class),mock(DriverRepository.class),mock(VehicleRepository.class),mock(DriverComplianceSummaryService.class),mock(VehicleComplianceSummaryService.class),mock(com.transportplatform.tms.features.compliance.application.TenantTransportComplianceService.class),mock(RouteStopRepository.class));
        var jdbc=mock(JdbcTemplate.class);var privacy=mock(PhiCipher.class);
        ReflectionTestUtils.setField(service,"jdbc",jdbc);ReflectionTestUtils.setField(service,"privacy",privacy);
        when(privacy.decrypt(anyString(),eq("coordinate"))).thenAnswer(call->call.getArgument(0));
        var first=mock(Ride.class);var next=mock(Ride.class);
        when(first.getId()).thenReturn(1L);when(next.getId()).thenReturn(2L);
        when(first.getScheduledPickupAt()).thenReturn(LocalDateTime.parse("2026-11-22T08:00:00"));
        when(first.getScheduledDropoffAt()).thenReturn(LocalDateTime.parse("2026-11-22T09:00:00"));
        when(next.getScheduledPickupAt()).thenReturn(LocalDateTime.parse("2026-11-22T09:10:00"));
        when(next.getScheduledDropoffAt()).thenReturn(LocalDateTime.parse("2026-11-22T10:00:00"));
        assertTrue(service.assignmentWindowsOverlap("tenant-a",first,next));
        when(next.getScheduledPickupAt()).thenReturn(LocalDateTime.parse("2026-11-22T09:30:00"));
        when(jdbc.queryForList(anyString(),eq("tenant-a"),eq(1L),eq(2L))).thenReturn(List.of(
            new HashMap<String,Object>(Map.of("ride_id",1L,"dropoff_latitude","42.0","dropoff_longitude","-71.0")),
            new HashMap<String,Object>(Map.of("ride_id",2L,"pickup_latitude","43.5","pickup_longitude","-71.0"))));
        assertTrue(service.assignmentWindowsOverlap("tenant-a",first,next));
        when(next.getScheduledPickupAt()).thenReturn(LocalDateTime.parse("2026-11-22T16:00:00"));
        when(next.getScheduledDropoffAt()).thenReturn(LocalDateTime.parse("2026-11-22T17:00:00"));
        assertFalse(service.assignmentWindowsOverlap("tenant-a",first,next));
    }
}
