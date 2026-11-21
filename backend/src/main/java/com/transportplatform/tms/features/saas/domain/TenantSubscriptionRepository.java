package com.transportplatform.tms.features.saas.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TenantSubscriptionRepository
        extends JpaRepository<TenantSubscription, Long>, JpaSpecificationExecutor<TenantSubscription> {

    Optional<TenantSubscription> findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
            String tenantId,
            Collection<TenantSubscriptionStatus> statuses);

    List<TenantSubscription> findAllByTenant_IdOrderByEffectiveStartDateDescCreatedAtDesc(String tenantId);

    boolean existsByTenant_IdAndStatusInAndIdNot(String tenantId, Collection<TenantSubscriptionStatus> statuses,
            Long id);

    boolean existsByTenant_IdAndStatusIn(String tenantId, Collection<TenantSubscriptionStatus> statuses);

    boolean existsByTenant_Id(String tenantId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from TenantSubscription s where s.id = :id")
    Optional<TenantSubscription> lockById(@org.springframework.data.repository.query.Param("id") Long id);

    long countByStatus(TenantSubscriptionStatus status);

    List<TenantSubscription> findAllByStatusIn(Collection<TenantSubscriptionStatus> statuses);
}