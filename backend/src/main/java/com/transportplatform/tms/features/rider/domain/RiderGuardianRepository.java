package com.transportplatform.tms.features.rider.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiderGuardianRepository extends JpaRepository<RiderGuardian, Long> {

    Optional<RiderGuardian> findByIdAndTenantId(Long id, String tenantId);

    Optional<RiderGuardian> findByTenantIdAndRider_IdAndGuardian_Id(String tenantId, Long riderId, Long guardianId);

    Optional<RiderGuardian> findByTenantIdAndRider_IdAndPrimaryGuardianTrueAndStatus(
            String tenantId,
            Long riderId,
            RiderGuardianStatus status);

    List<RiderGuardian> findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
            String tenantId,
            Long riderId,
            RiderGuardianStatus status);

    List<RiderGuardian> findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
            String tenantId,
            Long guardianId,
            RiderGuardianStatus status);

    List<RiderGuardian> findAllByTenantIdAndRider_IdInAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
            String tenantId,
            Collection<Long> riderIds,
            RiderGuardianStatus status);

    List<RiderGuardian> findAllByTenantIdAndGuardian_IdInAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
            String tenantId,
            Collection<Long> guardianIds,
            RiderGuardianStatus status);

    long countByTenantIdAndGuardian_IdAndStatus(String tenantId, Long guardianId, RiderGuardianStatus status);
}