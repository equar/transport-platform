package com.transportplatform.tms.features.ride.domain;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RideRepository extends JpaRepository<Ride, Long>, JpaSpecificationExecutor<Ride> {

    Optional<Ride> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndRideNumberIgnoreCase(String tenantId, String rideNumber);

    boolean existsByTenantIdAndRecurrenceScheduleIdAndScheduledPickupAt(
            String tenantId,
            Long recurrenceScheduleId,
            LocalDateTime scheduledPickupAt);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, RideStatus status);

    long countByTenantIdAndStatusIn(String tenantId, Collection<RideStatus> statuses);

    long countByTenantIdAndStatusInAndScheduledPickupAtBetween(
            String tenantId,
            Collection<RideStatus> statuses,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime);

    long countByTenantIdAndRecurrenceScheduleIsNotNull(String tenantId);

    long countByTenantIdAndRecurrenceScheduleId(String tenantId, Long recurrenceScheduleId);

    List<Ride> findAllByTenantIdAndDriverIdAndStatusInAndIdNot(
            String tenantId,
            Long driverId,
            Collection<RideStatus> statuses,
            Long rideId);

    List<Ride> findAllByTenantIdAndVehicleIdAndStatusInAndIdNot(
            String tenantId,
            Long vehicleId,
            Collection<RideStatus> statuses,
            Long rideId);
}