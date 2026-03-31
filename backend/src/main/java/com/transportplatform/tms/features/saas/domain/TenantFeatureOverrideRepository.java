package com.transportplatform.tms.features.saas.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantFeatureOverrideRepository extends JpaRepository<TenantFeatureOverride, Long> {

    Optional<TenantFeatureOverride> findByTenantIdAndFeatureFlag_Id(String tenantId, Long featureFlagId);

    List<TenantFeatureOverride> findAllByTenantId(String tenantId);

    long countByFeatureFlag_Id(Long featureFlagId);
}