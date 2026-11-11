package com.transportplatform.tms.features.riderguardianportal.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class GuardianEmptyRidesTest {
    @Mock RiderGuardianPortalAccessService accessService;
    @Mock RideRepository rideRepository;
    @InjectMocks RiderGuardianPortalService service;

    @Test
    void returnsAnEmptyPageForAGuardianWithoutLinkedRiders() {
        when(accessService.resolveCurrentScope()).thenReturn(
                new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                        null, PortalSubjectType.GUARDIAN, null, null, List.of(), List.of()));

        var result = service.searchRides(null, null, null, null, 0, 20, "scheduledPickupAt", Sort.Direction.DESC);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalElements()).isZero();
        assertThat(result.totalPages()).isZero();
        assertThat(result.page()).isZero();
        assertThat(result.size()).isEqualTo(20);
        verifyNoInteractions(rideRepository);
    }

    @Test
    void returnsRidesWithMissingOptionalAddressFields() {
        var rider = mock(Rider.class);
        when(rider.getId()).thenReturn(7L);
        var ride = new Ride();
        ride.setRider(rider);
        ride.setPickupAddressLine1("123 Main St");
        ride.setPickupAddressLine2(" ");
        ride.setPickupCity("Springfield");
        ride.setDropoffAddressLine1("456 Oak St");
        when(accessService.resolveCurrentScope()).thenReturn(
                new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                        null, PortalSubjectType.GUARDIAN, null, null, List.of(), List.of(rider)));
        when(rideRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Ride>>any(), any(Pageable.class)))
                .thenAnswer(invocation -> new org.springframework.data.domain.PageImpl<>(
                        List.of(ride), invocation.getArgument(1, Pageable.class), 1));

        var result = service.searchRides(null, null, null, null, 0, 20, "scheduledPickupAt", Sort.Direction.DESC);

        assertThat(result.items()).hasSize(1);
        assertThat(result.items().getFirst().pickupAddress()).isEqualTo("123 Main St, Springfield");
        assertThat(result.items().getFirst().dropoffAddress()).isEqualTo("456 Oak St");
    }

    @Test
    void returnsAnEmptyPageWhenLinkedRidersHaveNoRides() {
        var rider = mock(Rider.class);
        when(rider.getId()).thenReturn(7L);
        when(accessService.resolveCurrentScope()).thenReturn(
                new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                        null, PortalSubjectType.GUARDIAN, null, null, List.of(), List.of(rider)));
        when(rideRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Ride>>any(), any(Pageable.class)))
                .thenAnswer(invocation -> Page.<Ride>empty(invocation.getArgument(1, Pageable.class)));

        var result = service.searchRides(null, null, null, null, 0, 20, "scheduledPickupAt", Sort.Direction.DESC);

        assertThat(result.items()).isEmpty();
        assertThat(result.totalElements()).isZero();
        assertThat(result.totalPages()).isZero();
        verify(rideRepository).findAll(org.mockito.ArgumentMatchers.<Specification<Ride>>any(), any(Pageable.class));
    }
}
