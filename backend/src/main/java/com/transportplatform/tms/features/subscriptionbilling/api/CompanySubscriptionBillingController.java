package com.transportplatform.tms.features.subscriptionbilling.api;

import static com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.*;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.response.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.subscriptionbilling.application.SubscriptionBillingService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/company/subscription-billing")
@PreAuthorize("hasAnyRole('TENANT_ADMIN','BILLING_ADMIN')")
public class CompanySubscriptionBillingController {
  private final SubscriptionBillingService service;
  private final CurrentAuthenticatedUserService users;

  public CompanySubscriptionBillingController(
      SubscriptionBillingService service, CurrentAuthenticatedUserService users) {
    this.service = service;
    this.users = users;
  }

  private String tenant() {
    String id = users.requireCurrentUser().tenantId();
    if (id == null || id.isBlank())
      throw new ApiException(
          ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "A company account is required.");
    return id;
  }

  @GetMapping("/accounts")
  public ApiResponse<PageResponse<Account>> accounts(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
    return ApiResponse.success(service.accounts(tenant(), page, size));
  }

  @GetMapping("/invoices")
  public ApiResponse<PageResponse<Invoice>> invoices(
      @RequestParam(required = false) Long subscriptionId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return ApiResponse.success(service.invoices(tenant(), subscriptionId, page, size));
  }

  @GetMapping("/invoices/{id}")
  public ApiResponse<InvoiceDetail> detail(@PathVariable long id) {
    return ApiResponse.success(service.detail(id, tenant()));
  }
}
