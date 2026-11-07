package com.transportplatform.tms.features.dispatch.application;

import static org.junit.jupiter.api.Assertions.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class PooledRideCapacityTest {
    private Vehicle vehicle(int seats, int chairs) {
        Vehicle v = new Vehicle(); v.setCapacity(seats); v.setWheelchairCapacity(chairs); return v;
    }
    private Ride ride(int pickupHour, Integer dropoffHour, boolean chair, int companions) {
        Ride r = new Ride(); r.setStatus(RideStatus.SCHEDULED);
        r.setScheduledPickupAt(LocalDateTime.of(2026, 11, 7, pickupHour, 0));
        r.setScheduledDropoffAt(dropoffHour == null ? null : LocalDateTime.of(2026, 11, 7, dropoffHour, 0));
        r.setWheelchairRequired(chair); r.setCompanionCount(companions); return r;
    }
    @Test void rejectsOverlappingWheelchairsDespiteSufficientSeats() {
        assertThrows(ApiException.class, () -> PooledRideCapacity.validate(vehicle(8, 1),
                List.of(ride(9, 11, true, 0), ride(10, 12, true, 0))));
    }
    @Test void permitsSequentialPassengersReusingCapacity() {
        assertDoesNotThrow(() -> PooledRideCapacity.validate(vehicle(1, 1),
                List.of(ride(9, 10, true, 0), ride(10, 11, true, 0))));
    }
    @Test void includesCompanionsAndEscortButNotCancelledPassengers() {
        Ride first = ride(9, 11, false, 1); first.setEscortRequired(true);
        Ride cancelled = ride(9, 11, false, 9); cancelled.setStatus(RideStatus.CANCELLED);
        assertDoesNotThrow(() -> PooledRideCapacity.validate(vehicle(3, 0), List.of(first, cancelled)));
        assertThrows(ApiException.class, () -> PooledRideCapacity.validate(vehicle(3, 0),
                List.of(first, ride(10, 11, false, 0))));
    }
    @Test void unknownDurationDoesNotInventAvailableCapacity() {
        assertThrows(ApiException.class, () -> PooledRideCapacity.validate(vehicle(1, 0),
                List.of(ride(9, null, false, 0), ride(12, 13, false, 0))));
    }
    @Test void plannedStopExtensionCannotHideOverlappingOccupancy() {
        Ride first = ride(9, 10, true, 0), second = ride(10, 11, true, 0);
        org.springframework.test.util.ReflectionTestUtils.setField(first, "id", 1L);
        org.springframework.test.util.ReflectionTestUtils.setField(second, "id", 2L);
        var stop = new com.transportplatform.tms.features.route.domain.RouteStop();
        stop.setRide(first); stop.setPlannedDropoffAt(first.getScheduledDropoffAt().plusHours(1));
        assertThrows(ApiException.class, () -> PooledRideCapacity.validate(vehicle(8, 1),
                List.of(first, second), java.util.Map.of(1L, stop)));
    }
}
