package com.transportplatform.tms.features.saas.domain;

import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SubscriptionPlanRepository
        extends JpaRepository<SubscriptionPlan, Long>, JpaSpecificationExecutor<SubscriptionPlan> {

    boolean existsByPlanCodeIgnoreCase(String planCode);

    boolean existsByPlanCodeIgnoreCaseAndIdNot(String planCode, Long id);

    long countByStatus(SubscriptionPlanStatus status);

    Optional<SubscriptionPlan> findByIdAndStatusIn(Long id, Collection<SubscriptionPlanStatus> statuses);
}