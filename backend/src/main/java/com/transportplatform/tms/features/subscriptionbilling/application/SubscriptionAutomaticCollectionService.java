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
  public Invoice collect(long id) { return execute(id, false); }

  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public Invoice reconcile(long id) { return execute(id, true); }

  private Invoice execute(long id, boolean reconciliationOnly) {
    Invoice current = billing.invoice(id, null);
    if (current.status().equals("PAID") || !current.collectionMode().equals("AUTOMATIC")) return current;
    String original = billing.collectionProvider(id);
    var candidates = providers.stream().filter(SubscriptionPaymentCollector::available)
        .filter(provider -> original == null || original.equals(provider.providerId())).toList();
    if (candidates.size() != 1) throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE,HttpStatus.SERVICE_UNAVAILABLE,
        original == null ? "Configure exactly one automatic payment provider before collecting funds."
          : "The original payment provider is unavailable. Contact support to reconcile this invoice.");
    var provider=candidates.getFirst();
    var attempt=billing.beginAutomaticCollection(id,provider.providerId(),reconciliationOnly);
    var invoice=attempt.invoice();
    if(invoice.status().equals("PAID") || !invoice.collectionMode().equals("AUTOMATIC") || invoice.collectionState().equals("NOT_ATTEMPTED")) return invoice;
    try {
      String key="bakaroo-subscription-invoice-"+id;
      var result=attempt.startCharge()?provider.collect(invoice,key):provider.reconcile(invoice,key);
      return billing.finishAutomaticCollection(id,result);
    } catch(RuntimeException failure) {
      org.slf4j.LoggerFactory.getLogger(getClass()).warn("Subscription collection needs reconciliation invoiceId={}",id);
      return billing.invoice(id,null);
    }
  }
}
