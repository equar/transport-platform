package com.transportplatform.tms.features.rideevent.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RideEventRepository extends JpaRepository<RideEvent, Long> {

    List<RideEvent> findAllByTenantIdAndRide_IdOrderByCreatedAtAsc(String tenantId, Long rideId);
}