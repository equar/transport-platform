package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.saas.domain.*;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import java.time.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionProvisioningService {
  @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.features.saas.application.TenantEntitlementService entitlements;
  @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate db;
  private final SubscriptionPlanRepository plans;
  private final TenantSubscriptionRepository subscriptions;
  private final Clock clock;

  public SubscriptionProvisioningService(
      SubscriptionPlanRepository plans, TenantSubscriptionRepository subscriptions, Clock clock) {
    this.plans = plans;
    this.subscriptions = subscriptions;
    this.clock = clock;
  }

  @Transactional
  public void provision(Tenant tenant) {
    entitlements.lockTenant(tenant.getId());
    if (!db.queryForList("SELECT id FROM tenant_subscriptions WHERE tenant_id=? FOR SHARE", Long.class, tenant.getId()).isEmpty()) return;
    SubscriptionPlan plan =
        plans
            .findByPlanCodeIgnoreCase(tenant.getSubscriptionPlan())
            .filter(p -> p.getStatus() == SubscriptionPlanStatus.ACTIVE)
            .orElseThrow(
                () ->
                    new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        HttpStatus.BAD_REQUEST,
                        "Select an active subscription plan before provisioning this company."));
    TenantSubscription s = new TenantSubscription();
    s.setTenant(tenant);
    s.setSubscriptionPlan(plan);
    s.setEffectiveStartDate(LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC));
    s.setRenewalDate(s.getEffectiveStartDate().plusMonths(1));
    s.setTrial(false);
    s.setStatus(TenantSubscriptionStatus.ACTIVE);
    s.setNotes(
        "Provisioned with the company. Platform admin must configure the USD per-driver rate and"
            + " first renewal before invoicing starts.");
    subscriptions.saveAndFlush(s);
  }
}
