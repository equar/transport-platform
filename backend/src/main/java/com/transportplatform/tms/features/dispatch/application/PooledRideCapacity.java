package com.transportplatform.tms.features.dispatch.application;

import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;

/** Capacity for concurrent passengers; drop-offs at a boundary precede pickups. */
public final class PooledRideCapacity {
    private static final EnumSet<RideStatus> TERMINAL = EnumSet.of(RideStatus.COMPLETED,
            RideStatus.CANCELLED, RideStatus.FAILED, RideStatus.MISSED, RideStatus.RIDER_NO_SHOW);

    private PooledRideCapacity() {}

    public static void validate(Vehicle vehicle, Collection<Ride> rides) {
        validate(vehicle, rides, java.util.Map.of());
    }

    public static void validate(Vehicle vehicle, Collection<Ride> rides,
            Map<Long, RouteStop> plannedStops) {
        Map<LocalDateTime, int[]> events = new TreeMap<>();
        for (Ride ride : rides) {
            if (TERMINAL.contains(ride.getStatus())) continue;
            int seats = 1 + Math.max(0, ride.getCompanionCount()) + (ride.isEscortRequired() ? 1 : 0);
            int wheelchairs = ride.isWheelchairRequired() ? 1 : 0;
            var stop = ride.getId() == null ? null : plannedStops.get(ride.getId());
            LocalDateTime pickup = ride.getScheduledPickupAt();
            LocalDateTime dropoff = ride.getScheduledDropoffAt();
            // Reserve the union until planned and booked times agree, never less than either schedule.
            if (stop != null) {
                if (stop.getPlannedPickupAt() != null && (pickup == null || stop.getPlannedPickupAt().isBefore(pickup))) pickup = stop.getPlannedPickupAt();
                if (dropoff != null && stop.getPlannedDropoffAt() != null && stop.getPlannedDropoffAt().isAfter(dropoff)) dropoff = stop.getPlannedDropoffAt();
            }
            interval(events, pickup, dropoff, seats, wheelchairs);
            if (ride.getReturnPickupAt() != null) {
                interval(events, ride.getReturnPickupAt(), ride.getReturnDropoffAt(), seats, wheelchairs);
            }
        }
        int seats = 0, wheelchairs = 0;
        for (int[] delta : events.values()) {
            seats += delta[0]; wheelchairs += delta[1];
            if (vehicle.getCapacity() == null || seats > vehicle.getCapacity()
                    || wheelchairs > (vehicle.getWheelchairCapacity() == null ? 0 : vehicle.getWheelchairCapacity())) {
                throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                        "Overlapping route rides exceed the vehicle's seat or wheelchair capacity.");
            }
        }
    }

    private static void interval(Map<LocalDateTime, int[]> events, LocalDateTime pickup,
            LocalDateTime dropoff, int seats, int wheelchairs) {
        if (pickup == null) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "Route capacity requires a scheduled pickup time.");
        // Unknown duration reserves capacity indefinitely; do not invent an arrival estimate.
        LocalDateTime end = dropoff == null ? LocalDateTime.MAX : dropoff;
        if (!end.isAfter(pickup)) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "Route dropoff must be after pickup to validate shared capacity.");
        int[] start = events.computeIfAbsent(pickup, key -> new int[2]);
        start[0] += seats; start[1] += wheelchairs;
        int[] finish = events.computeIfAbsent(end, key -> new int[2]);
        finish[0] -= seats; finish[1] -= wheelchairs;
    }
}
