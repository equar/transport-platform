package com.transportplatform.tms.features.subscriptionbilling.application;

import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    name = "app.subscription-billing.enabled",
    havingValue = "true",
    matchIfMissing = true)
public class SubscriptionBillingWorker {
  private final SubscriptionBillingService billing;
  private final SubscriptionAutomaticCollectionService automatic;

  public SubscriptionBillingWorker(
      SubscriptionBillingService billing, SubscriptionAutomaticCollectionService automatic) {
    this.billing = billing;
    this.automatic = automatic;
  }

  @Scheduled(
      fixedDelayString = "${app.subscription-billing.interval-ms:3600000}",
      initialDelayString = "${app.subscription-billing.initial-delay-ms:60000}")
  public void renew() {
    long cursor = 0;
    while (true) {
      var ids = billing.dueAccounts(cursor, 100);
      if (ids.isEmpty()) break;
      for (long id : ids) {
        cursor = id;
        try {
          for (int n = 0; n < 12; n++) {
            Long invoice = billing.generateRenewal(id);
            if (invoice == null) break;
          }
        } catch (RuntimeException e) {
          LoggerFactory.getLogger(getClass())
              .warn("Subscription renewal failed subscriptionId={}", id);
        }
      }
    }
    cursor = 0;
    while (true) {
      var ids = billing.automaticInvoices(cursor);
      if (ids.isEmpty()) break;
      for (long id : ids) {
        cursor = id;
        try {
          automatic.collect(id);
        } catch (RuntimeException e) {
          LoggerFactory.getLogger(getClass())
              .warn("Subscription collection unavailable invoiceId={}", id);
        }
      }
    }
  }
}
