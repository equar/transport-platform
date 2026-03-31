package com.transportplatform.tms.features.ride.domain;

import java.time.LocalDateTime;
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

    long countByTenantIdAndRecurrenceScheduleIsNotNull(String tenantId);

    long countByTenantIdAndRecurrenceScheduleId(String tenantId, Long recurrenceScheduleId);
}