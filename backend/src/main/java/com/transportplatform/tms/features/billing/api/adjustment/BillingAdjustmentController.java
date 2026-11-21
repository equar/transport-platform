package com.transportplatform.tms.features.billing.api.adjustment;

import static com.transportplatform.tms.features.billing.api.adjustment.BillingAdjustmentRecords.*;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.billing.application.BillingAdjustmentService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('TENANT_ADMIN','BILLING_ADMIN')")
public class BillingAdjustmentController {
    private final BillingAdjustmentService service;

    public BillingAdjustmentController(BillingAdjustmentService service) {
        this.service = service;
    }

    @PostMapping("/company/payments/{id}/refunds")
    public ApiResponse<Refund> refund(
            @PathVariable long id,
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody RefundRequest request) {
        return ApiResponse.success(service.refund(id, request, key));
    }

    @GetMapping("/company/payments/{id}/refunds")
    public ApiResponse<List<Refund>> refunds(@PathVariable long id) {
        return ApiResponse.success(service.refunds(id));
    }

    @PostMapping("/company/invoices/{id}/credit-notes")
    public ApiResponse<CreditNote> credit(
            @PathVariable long id,
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody CreditRequest request) {
        return ApiResponse.success(service.createCredit(id, request, key));
    }

    @GetMapping("/company/invoices/{id}/credit-notes")
    public ApiResponse<List<CreditNote>> credits(
            @PathVariable long id, @RequestParam(defaultValue = "false") boolean available) {
        return ApiResponse.success(service.credits(id, available));
    }

    @PostMapping("/company/credit-notes/{id}/apply")
    public ApiResponse<CreditApplication> apply(
            @PathVariable long id,
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody ApplyCreditRequest request) {
        return ApiResponse.success(service.applyCredit(id, request, key));
    }

    @PostMapping("/company/credit-notes/{id}/void")
    public ApiResponse<CreditNote> voidCredit(
            @PathVariable long id,
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody VoidCreditRequest request) {
        return ApiResponse.success(service.voidCredit(id, request, key));
    }
}
