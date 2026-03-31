package com.transportplatform.tms.features.saas.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, Long>, JpaSpecificationExecutor<FeatureFlag> {

    boolean existsByFlagCodeIgnoreCase(String flagCode);

    boolean existsByFlagCodeIgnoreCaseAndIdNot(String flagCode, Long id);

    long countByStatus(FeatureFlagStatus status);

    List<FeatureFlag> findAllByStatus(FeatureFlagStatus status);
}