package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.Invoice;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** The durable PENDING checkpoint commits before calling an external payment system. */
@Service
public class SubscriptionAutomaticCollectionService {
  private final SubscriptionBillingService billing;
  private final List<SubscriptionPaymentCollector> providers;

  public SubscriptionAutomaticCollectionService(
      SubscriptionBillingService billing, List<SubscriptionPaymentCollector> providers) {
    this.billing = billing;
    this.providers = providers;
  }

  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public Invoice collect(long id) {
    var provider =
        providers.stream()
            .filter(SubscriptionPaymentCollector::available)
            .findFirst()
            .orElseThrow(
                () ->
                    new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        HttpStatus.BAD_REQUEST,
                        "No automatic payment provider is configured."));
    Invoice invoice = billing.beginAutomaticCollection(id);
    if (invoice.status().equals("PAID") || !invoice.collectionMode().equals("AUTOMATIC"))
      return invoice;
    try {
      var result = provider.collect(invoice, "bakaroo-subscription-invoice-" + id);
      return billing.finishAutomaticCollection(id, result);
    } catch (RuntimeException e) {
      org.slf4j.LoggerFactory.getLogger(getClass())
          .warn("Subscription collection needs reconciliation invoiceId={}", id);
      return billing.invoice(id, null);
    }
  }
}
