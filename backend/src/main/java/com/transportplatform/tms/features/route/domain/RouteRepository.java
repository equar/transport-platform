package com.transportplatform.tms.features.route.domain;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RouteRepository extends JpaRepository<Route, Long>, JpaSpecificationExecutor<Route> {

    Optional<Route> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndRouteCodeIgnoreCase(String tenantId, String routeCode);

    long countByTenantIdAndRouteDateAndStatus(String tenantId, LocalDate routeDate, RouteStatus status);

    long countByTenantIdAndStatusIn(String tenantId, Collection<RouteStatus> statuses);
}