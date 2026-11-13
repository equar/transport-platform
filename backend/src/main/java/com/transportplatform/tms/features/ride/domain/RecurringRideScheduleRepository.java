package com.transportplatform.tms.features.ride.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RecurringRideScheduleRepository
        extends JpaRepository<RecurringRideSchedule, Long>, JpaSpecificationExecutor<RecurringRideSchedule> {

    Optional<RecurringRideSchedule> findByIdAndTenantId(Long id, String tenantId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from RecurringRideSchedule s where s.id=:id and s.tenantId=:tenantId")
    Optional<RecurringRideSchedule> lockForGeneration(@org.springframework.data.repository.query.Param("id") Long id,
            @org.springframework.data.repository.query.Param("tenantId") String tenantId);

    boolean existsByTenantIdAndRecurrenceCodeIgnoreCase(String tenantId, String recurrenceCode);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, RideRecurrenceStatus status);
}