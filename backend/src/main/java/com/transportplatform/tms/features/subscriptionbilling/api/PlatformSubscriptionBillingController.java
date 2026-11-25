package com.transportplatform.tms.features.subscriptionbilling.api;

import static com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.*;

import com.transportplatform.tms.common.response.*;
import com.transportplatform.tms.features.subscriptionbilling.application.SubscriptionAutomaticCollectionService;
import com.transportplatform.tms.features.subscriptionbilling.application.SubscriptionBillingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/platform/subscription-billing")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformSubscriptionBillingController {
  @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.features.subscriptionbilling.application.SubscriptionAdjustmentService adjustments;
  @PostMapping("/invoices/{id}/adjustments")
  public ApiResponse<InvoiceDetail> adjust(@PathVariable long id,@Valid @RequestBody AdjustmentRequest request,
          @RequestHeader("Idempotency-Key") String key) {
    return ApiResponse.success(adjustments.adjust(id,request,key));
  }

  private final SubscriptionBillingService service;
  private final SubscriptionAutomaticCollectionService automatic;

  public PlatformSubscriptionBillingController(
      SubscriptionBillingService service, SubscriptionAutomaticCollectionService automatic) {
    this.service = service;
    this.automatic = automatic;
  }

  @GetMapping("/accounts")
  public ApiResponse<PageResponse<Account>> accounts(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
    return ApiResponse.success(service.accounts(null, page, size));
  }

  @GetMapping("/accounts/{id}")
  public ApiResponse<Account> account(@PathVariable long id) {
    return ApiResponse.success(service.account(id, null));
  }

  @PutMapping("/accounts/{id}")
  public ApiResponse<Account> configure(
      @PathVariable long id, @Valid @RequestBody Configure request) {
    return ApiResponse.success(service.configure(id, request));
  }

  @PostMapping("/accounts/{id}/generate")
  public ApiResponse<Invoice> generate(@PathVariable long id) {
    Long invoice = service.generateRenewal(id);
    return ApiResponse.success(invoice == null ? null : service.invoice(invoice, null));
  }

  @GetMapping("/invoices")
  public ApiResponse<PageResponse<Invoice>> invoices(
      @RequestParam(required = false) Long subscriptionId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return ApiResponse.success(service.invoices(null, subscriptionId, page, size));
  }

  @GetMapping("/invoices/{id}")
  public ApiResponse<InvoiceDetail> detail(@PathVariable long id) {
    return ApiResponse.success(service.detail(id, null));
  }

  @PostMapping("/invoices/{id}/payments")
  public ApiResponse<Invoice> pay(
      @PathVariable long id, @Valid @RequestBody PaymentRequest request) {
    return ApiResponse.success(service.recordManualPayment(id, request));
  }

  @PostMapping("/invoices/{id}/collect")
  public ApiResponse<Invoice> collect(@PathVariable long id) {
    return ApiResponse.success(automatic.collect(id));
  }
  @PostMapping("/invoices/{id}/reconcile")
  public ApiResponse<Invoice> reconcile(@PathVariable long id) {
    return ApiResponse.success(automatic.reconcile(id));
  }

}
