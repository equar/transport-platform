package com.transportplatform.tms.features.ride.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.api.request.GenerateRecurringRideInstancesRequest;
import com.transportplatform.tms.features.ride.api.request.RecurringRideScheduleUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RideGenerationResultResponse;
import com.transportplatform.tms.features.ride.domain.RecurringRideSchedule;
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideBillingType;
import com.transportplatform.tms.features.ride.domain.RideRecurrencePatternType;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RecurringRideScheduleServiceTest {

    @Mock
    private RecurringRideScheduleRepository recurringRideScheduleRepository;

    @Mock
    private RideRepository rideRepository;

    @Mock
    private RideAccessService rideAccessService;

    @Mock
    private RideReferenceValidationService rideReferenceValidationService;

    @Mock
    private RecurringRideCodeGenerator recurringRideCodeGenerator;

    @Mock
    private RideCodeGenerator rideCodeGenerator;

    @Mock
    private AuditLogService auditLogService;

    @Test
    void createRecurringScheduleRejectsWeeklyPatternWithoutCadence() {
        RecurringRideScheduleService service = new RecurringRideScheduleService(
                recurringRideScheduleRepository,
                rideRepository,
                rideAccessService,
                rideReferenceValidationService,
                new RecurringRideScheduleMapper(),
                recurringRideCodeGenerator,
                rideCodeGenerator,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        Rider rider = buildRider();

        when(rideAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(recurringRideCodeGenerator.generate("tenant-123")).thenReturn("RCR-000123");
        when(rideReferenceValidationService.resolve("tenant-123", 11L, null, null, null, null))
                .thenReturn(new RideReferenceValidationService.ResolvedReferences(rider, null, null, null, null));

        ApiException exception = assertThrows(ApiException.class,
                () -> service.createCompanyRecurringRideSchedule(buildWeeklyRequest(Set.of(), null)));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
        verify(recurringRideScheduleRepository, never()).save(any(RecurringRideSchedule.class));
    }

    @Test
    void generateRecurringRideInstancesSkipsDuplicatesAndCreatesMissingDates() {
        RecurringRideScheduleService service = new RecurringRideScheduleService(
                recurringRideScheduleRepository,
                rideRepository,
                rideAccessService,
                rideReferenceValidationService,
                new RecurringRideScheduleMapper(),
                recurringRideCodeGenerator,
                rideCodeGenerator,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        RecurringRideSchedule schedule = buildDailySchedule();

        when(rideAccessService.findRecurringRideScheduleForCompanyScope(91L)).thenReturn(schedule);
        when(rideRepository.countByTenantIdAndRecurrenceScheduleId("tenant-123", null)).thenReturn(0L);
        when(rideRepository.existsByTenantIdAndRecurrenceScheduleIdAndScheduledPickupAt(
                eq("tenant-123"),
                eq(null),
                eq(LocalDateTime.of(2026, 4, 1, 8, 0)))).thenReturn(true);
        when(rideRepository.existsByTenantIdAndRecurrenceScheduleIdAndScheduledPickupAt(
                eq("tenant-123"),
                eq(null),
                eq(LocalDateTime.of(2026, 4, 2, 8, 0)))).thenReturn(false);
        when(rideCodeGenerator.generate("tenant-123")).thenReturn("TRIP-000124");
        when(rideRepository.save(any(Ride.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RideGenerationResultResponse result = service.generateCompanyRecurringRideInstances(
                91L,
                new GenerateRecurringRideInstancesRequest(LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 2)));

        assertEquals(1, result.createdCount());
        assertEquals(1, result.duplicateCount());
        assertEquals(0, result.skippedCount());

        ArgumentCaptor<Ride> rideCaptor = ArgumentCaptor.forClass(Ride.class);
        verify(rideRepository).save(rideCaptor.capture());
        assertEquals(LocalDateTime.of(2026, 4, 2, 8, 0), rideCaptor.getValue().getScheduledPickupAt());
        assertEquals(schedule, rideCaptor.getValue().getRecurrenceSchedule());
    }

    private Rider buildRider() {
        Rider rider = new Rider();
        rider.setTenantId("tenant-123");
        rider.setRiderCode("RID-000123");
        rider.setRiderType(RiderType.STUDENT);
        rider.setFirstName("Taylor");
        rider.setLastName("Jordan");
        rider.setPrimaryPhone("5551112222");
        rider.setStatus(RiderStatus.ACTIVE);
        return rider;
    }

    private RecurringRideScheduleUpsertRequest buildWeeklyRequest(Set<DayOfWeek> daysOfWeek, Integer intervalDays) {
        return new RecurringRideScheduleUpsertRequest(
                11L,
                null,
                null,
                null,
                null,
                ServiceType.GENERAL_TRANSPORT,
                RideTripType.ONE_WAY,
                "123 Main St",
                null,
                "Austin",
                "TX",
                "78701",
                "US",
                "456 Oak Ave",
                null,
                "Austin",
                "TX",
                "78702",
                "US",
                LocalTime.of(8, 0),
                LocalTime.of(8, 45),
                null,
                null,
                RideRecurrencePatternType.WEEKLY,
                daysOfWeek,
                intervalDays,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 30),
                null,
                Set.of(),
                false,
                false,
                0,
                null,
                null,
                RideBillingType.CONTRACT,
                RideRecurrenceStatus.DRAFT);
    }

    private RecurringRideSchedule buildDailySchedule() {
        RecurringRideSchedule schedule = new RecurringRideSchedule();
        schedule.setTenantId("tenant-123");
        schedule.setRecurrenceCode("RCR-000123");
        schedule.setRider(buildRider());
        schedule.setServiceType(ServiceType.GENERAL_TRANSPORT);
        schedule.setTripType(RideTripType.ONE_WAY);
        schedule.setPickupAddressLine1("123 Main St");
        schedule.setPickupCity("Austin");
        schedule.setPickupState("TX");
        schedule.setPickupZipCode("78701");
        schedule.setPickupCountry("US");
        schedule.setDropoffAddressLine1("456 Oak Ave");
        schedule.setDropoffCity("Austin");
        schedule.setDropoffState("TX");
        schedule.setDropoffZipCode("78702");
        schedule.setDropoffCountry("US");
        schedule.setScheduledPickupTime(LocalTime.of(8, 0));
        schedule.setScheduledDropoffTime(LocalTime.of(8, 45));
        schedule.setRecurrencePatternType(RideRecurrencePatternType.DAILY);
        schedule.setStartDate(LocalDate.of(2026, 4, 1));
        schedule.setEndDate(LocalDate.of(2026, 4, 2));
        schedule.setStatus(RideRecurrenceStatus.ACTIVE);
        schedule.setBillingType(RideBillingType.CONTRACT);
        return schedule;
    }
}