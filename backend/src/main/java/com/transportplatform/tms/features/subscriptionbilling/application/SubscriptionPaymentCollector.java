package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.Invoice;
import java.math.BigDecimal;

/**
 * Optional provider adapter. Implementations must use the supplied stable idempotency key,
 * authenticate provider confirmations, and return SETTLED only for verified USD funds received. A
 * retry must retrieve the original collection, never create a second charge.
 */
public interface SubscriptionPaymentCollector {
  boolean available();

  default String providerId() { return getClass().getName(); }

  Result collect(Invoice invoice, String idempotencyKey);

  /** Read-only provider lookup. Never issue a charge while reconciling an uncertain outcome. */
  default Result reconcile(Invoice invoice, String idempotencyKey) { return null; }

  record Result(boolean settled, String reference, BigDecimal amount, String currency, boolean verifiedNotCharged) {
    public Result(boolean settled, String reference, BigDecimal amount, String currency) {
      this(settled, reference, amount, currency, false);
    }
  }
}
