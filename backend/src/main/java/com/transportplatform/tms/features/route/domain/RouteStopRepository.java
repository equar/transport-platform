package com.transportplatform.tms.features.route.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {

    Optional<RouteStop> findByIdAndTenantId(Long id, String tenantId);

    List<RouteStop> findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(String tenantId, Long routeId);

    boolean existsByTenantIdAndRide_Id(String tenantId, Long rideId);

    boolean existsByTenantIdAndRide_IdAndIdNot(String tenantId, Long rideId, Long routeStopId);

    void deleteAllByTenantIdAndRoute_Id(String tenantId, Long routeId);

    List<RouteStop> findAllByTenantIdAndRoute_IdInOrderByStopSequenceAsc(String tenantId, Collection<Long> routeIds);
}