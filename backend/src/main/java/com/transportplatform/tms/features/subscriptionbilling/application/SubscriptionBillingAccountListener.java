package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionBillingAccountListener {
  private final JdbcTemplate db;

  public SubscriptionBillingAccountListener(JdbcTemplate db) {
    this.db = db;
  }

  @PostPersist
  public void create(TenantSubscription subscription) {
    db.update(
        "INSERT INTO subscription_billing_accounts(subscription_id,tenant_id) VALUES(?,?)",
        subscription.getId(),
        subscription.getTenant().getId());
  }

  @PostUpdate
  public void update(TenantSubscription subscription) {
    if (subscription.getStatus() == TenantSubscriptionStatus.SUSPENDED
        || subscription.getStatus() == TenantSubscriptionStatus.CANCELLED
        || subscription.getStatus() == TenantSubscriptionStatus.EXPIRED)
      db.update(
          "UPDATE subscription_billing_accounts SET enabled=FALSE WHERE subscription_id=?",
          subscription.getId());
  }
}
