package com.transportplatform.tms.features.billing.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.billing.api.request.PaymentPreviewRequest;
import com.transportplatform.tms.features.billing.api.request.PaymentUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.PaymentVoidRequest;
import com.transportplatform.tms.features.billing.api.response.PaymentDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentPreviewResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.application.PaymentService;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentManagementController {

    private final PaymentService paymentService;

    public PaymentManagementController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/company/payments")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<PaymentSummaryResponse>> searchCompanyPayments(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(paymentService.searchCompanyPayments(
                keyword,
                status,
                paymentMethod,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/payments/{paymentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PaymentDetailResponse> getCompanyPayment(@PathVariable Long paymentId) {
        return ApiResponse.success(paymentService.getCompanyPayment(paymentId));
    }

    @GetMapping("/company/invoices/{invoiceId}/payments")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<PaymentSummaryResponse>> listCompanyInvoicePayments(@PathVariable Long invoiceId) {
        return ApiResponse.success(paymentService.listCompanyInvoicePayments(invoiceId));
    }

    @PostMapping("/company/payments/preview")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PaymentPreviewResponse> previewCompanyPayment(
            @Valid @RequestBody PaymentPreviewRequest request) {
        return ApiResponse.success(paymentService.previewCompanyPayment(request));
    }

    @PostMapping("/company/payments")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentDetailResponse> createCompanyPayment(@Valid @RequestBody PaymentUpsertRequest request) {
        return ApiResponse.success(paymentService.createCompanyPayment(request));
    }

    @PutMapping("/company/payments/{paymentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PaymentDetailResponse> updateCompanyPayment(@PathVariable Long paymentId,
            @Valid @RequestBody PaymentUpsertRequest request) {
        return ApiResponse.success(paymentService.updateCompanyPayment(paymentId, request));
    }

    @PostMapping("/company/payments/{paymentId}/apply")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PaymentDetailResponse> applyCompanyPayment(@PathVariable Long paymentId) {
        return ApiResponse.success(paymentService.applyCompanyPayment(paymentId));
    }

    @PostMapping("/company/payments/{paymentId}/void")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PaymentDetailResponse> voidCompanyPayment(@PathVariable Long paymentId,
            @Valid @RequestBody PaymentVoidRequest request) {
        return ApiResponse.success(paymentService.voidCompanyPayment(paymentId, request));
    }
}