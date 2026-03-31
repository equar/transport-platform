package com.transportplatform.tms.features.ride.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.api.request.CancelRideRequest;
import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideBillingType;
import com.transportplatform.tms.features.ride.domain.RidePriorityLevel;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class RideServiceTest {

        @Mock
        private RideRepository rideRepository;

        @Mock
        private RideAccessService rideAccessService;

        @Mock
        private RideReferenceValidationService rideReferenceValidationService;

        @Mock
        private RideCodeGenerator rideCodeGenerator;

        @Mock
        private AuditLogService auditLogService;

        @Mock
        private RideEventService rideEventService;

        @Mock
        private NotificationEventService notificationEventService;

        @Test
        void companyRideCreationUsesTenantScopeAndRequestedDefault() {
                RideService rideService = new RideService(
                                rideRepository,
                                rideAccessService,
                                rideReferenceValidationService,
                                new RideMapper(),
                                rideCodeGenerator,
                                rideEventService,
                                auditLogService,
                                notificationEventService,
                                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

                Rider rider = buildRider();

                when(rideAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
                when(rideCodeGenerator.generate("tenant-123")).thenReturn("TRIP-000123");
                when(rideReferenceValidationService.resolve("tenant-123", 11L, null, null, null, null))
                                .thenReturn(new RideReferenceValidationService.ResolvedReferences(rider, null, null,
                                                null, null));
                when(rideRepository.save(any(Ride.class))).thenAnswer(invocation -> invocation.getArgument(0));

                rideService.createCompanyRide(buildOneWayRequest(null));

                ArgumentCaptor<Ride> rideCaptor = ArgumentCaptor.forClass(Ride.class);
                verify(rideRepository).save(rideCaptor.capture());
                assertEquals("tenant-123", rideCaptor.getValue().getTenantId());
                assertEquals("TRIP-000123", rideCaptor.getValue().getRideNumber());
                assertEquals(RideStatus.REQUESTED, rideCaptor.getValue().getStatus());
        }

        @Test
        void companyRideCreationRejectsRoundTripWithoutReturnLeg() {
                RideService rideService = new RideService(
                                rideRepository,
                                rideAccessService,
                                rideReferenceValidationService,
                                new RideMapper(),
                                rideCodeGenerator,
                                rideEventService,
                                auditLogService,
                                notificationEventService,
                                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

                Rider rider = buildRider();

                when(rideAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
                when(rideCodeGenerator.generate("tenant-123")).thenReturn("TRIP-000123");
                when(rideReferenceValidationService.resolve("tenant-123", 11L, null, null, null, null))
                                .thenReturn(new RideReferenceValidationService.ResolvedReferences(rider, null, null,
                                                null, null));

                ApiException exception = assertThrows(ApiException.class,
                                () -> rideService.createCompanyRide(buildRoundTripRequestWithoutReturn()));

                assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
        }

        @Test
        void cancelRideCapturesAuditFields() {
                RideService rideService = new RideService(
                                rideRepository,
                                rideAccessService,
                                rideReferenceValidationService,
                                new RideMapper(),
                                rideCodeGenerator,
                                rideEventService,
                                auditLogService,
                                notificationEventService,
                                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

                Ride ride = new Ride();
                ride.setTenantId("tenant-123");
                ride.setRideNumber("TRIP-000123");
                ride.setStatus(RideStatus.REQUESTED);
                ride.setRider(buildRider());
                ride.setServiceType(ServiceType.GENERAL_TRANSPORT);
                ride.setTripType(RideTripType.ONE_WAY);
                ride.setPickupAddressLine1("123 Main St");
                ride.setPickupCity("Austin");
                ride.setPickupState("TX");
                ride.setPickupZipCode("78701");
                ride.setPickupCountry("US");
                ride.setDropoffAddressLine1("456 Oak Ave");
                ride.setDropoffCity("Austin");
                ride.setDropoffState("TX");
                ride.setDropoffZipCode("78702");
                ride.setDropoffCountry("US");
                ride.setScheduledPickupAt(LocalDateTime.of(2026, 4, 1, 8, 0));

                when(rideAccessService.findRideForCompanyScope(50L)).thenReturn(ride);
                when(rideAccessService.requireCompanyUser()).thenReturn(new AuthenticatedUser(
                                9L,
                                "tenant-123",
                                "scheduler@example.com",
                                "Jamie",
                                "Planner",
                                "secret",
                                true,
                                true,
                                List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))));
                when(rideRepository.save(any(Ride.class))).thenAnswer(invocation -> invocation.getArgument(0));

                rideService.cancelCompanyRide(50L, new CancelRideRequest("Rider no longer needs transport."));

                assertEquals(RideStatus.CANCELLED, ride.getStatus());
                assertEquals("Rider no longer needs transport.", ride.getCancellationReason());
                assertEquals("Jamie Planner", ride.getCancelledBy());
                assertEquals(Instant.parse("2026-03-31T12:00:00Z"), ride.getCancelledAt());
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

        private RideUpsertRequest buildOneWayRequest(RideStatus status) {
                return new RideUpsertRequest(
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
                                LocalDateTime.of(2026, 4, 1, 8, 0),
                                LocalDateTime.of(2026, 4, 1, 8, 45),
                                null,
                                null,
                                false,
                                false,
                                1,
                                "Handle with care",
                                "Internal note",
                                "Operational note",
                                RidePriorityLevel.STANDARD,
                                RideBillingType.CONTRACT,
                                status);
        }

        private RideUpsertRequest buildRoundTripRequestWithoutReturn() {
                return new RideUpsertRequest(
                                11L,
                                null,
                                null,
                                null,
                                null,
                                ServiceType.GENERAL_TRANSPORT,
                                RideTripType.ROUND_TRIP,
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
                                LocalDateTime.of(2026, 4, 1, 8, 0),
                                LocalDateTime.of(2026, 4, 1, 8, 45),
                                null,
                                null,
                                false,
                                false,
                                0,
                                null,
                                null,
                                null,
                                RidePriorityLevel.STANDARD,
                                RideBillingType.CONTRACT,
                                RideStatus.REQUESTED);
        }
}