package com.transportplatform.tms.features.billing.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PricingRuleRepository extends JpaRepository<PricingRule, Long>, JpaSpecificationExecutor<PricingRule> {

    Optional<PricingRule> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndPricingRuleCodeIgnoreCase(String tenantId, String pricingRuleCode);
}
