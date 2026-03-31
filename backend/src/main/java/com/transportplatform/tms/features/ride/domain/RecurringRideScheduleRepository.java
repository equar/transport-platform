package com.transportplatform.tms.features.ride.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RecurringRideScheduleRepository
        extends JpaRepository<RecurringRideSchedule, Long>, JpaSpecificationExecutor<RecurringRideSchedule> {

    Optional<RecurringRideSchedule> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndRecurrenceCodeIgnoreCase(String tenantId, String recurrenceCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, RideRecurrenceStatus status);
}