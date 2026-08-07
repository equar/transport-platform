package com.transportplatform.tms.features.billing.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.billing.api.request.BillingPreviewRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceLineItemUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.ManualInvoiceGenerationRequest;
import com.transportplatform.tms.features.billing.api.request.VoidInvoiceRequest;
import com.transportplatform.tms.features.billing.api.response.BillingPreviewResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceDetailResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceLineItemResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.application.InvoiceService;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InvoiceManagementController {

    private final InvoiceService invoiceService;

    public InvoiceManagementController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/company/invoices")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<PageResponse<InvoiceSummaryResponse>> searchCompanyInvoices(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) InvoiceAgingBucket agingBucket,
            @RequestParam(required = false) BillToType billToType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Boolean overdueOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(invoiceService.searchCompanyInvoices(
                keyword,
                status,
                agingBucket,
                billToType,
                fromDate,
                toDate,
                overdueOnly,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<InvoiceDetailResponse> getCompanyInvoice(@PathVariable Long invoiceId) {
        return ApiResponse.success(invoiceService.getCompanyInvoice(invoiceId));
    }

    @GetMapping("/company/invoices/{invoiceId}/line-items")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<List<InvoiceLineItemResponse>> listCompanyInvoiceLineItems(@PathVariable Long invoiceId) {
        return ApiResponse.success(invoiceService.listCompanyInvoiceLineItems(invoiceId));
    }

    @PostMapping("/company/invoices")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceDetailResponse> createCompanyInvoice(@Valid @RequestBody InvoiceUpsertRequest request) {
        return ApiResponse.success(invoiceService.createCompanyInvoice(request));
    }

    @PutMapping("/company/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<InvoiceDetailResponse> updateCompanyInvoice(@PathVariable Long invoiceId,
            @Valid @RequestBody InvoiceUpsertRequest request) {
        return ApiResponse.success(invoiceService.updateCompanyInvoice(invoiceId, request));
    }

    @PostMapping("/company/invoices/{invoiceId}/line-items")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceLineItemResponse> addLineItem(@PathVariable Long invoiceId,
            @Valid @RequestBody InvoiceLineItemUpsertRequest request) {
        return ApiResponse.success(invoiceService.addLineItem(invoiceId, request));
    }

    @PutMapping("/company/invoice-line-items/{lineItemId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<InvoiceLineItemResponse> updateLineItem(@PathVariable Long lineItemId,
            @Valid @RequestBody InvoiceLineItemUpsertRequest request) {
        return ApiResponse.success(invoiceService.updateLineItem(lineItemId, request));
    }

    @DeleteMapping("/company/invoice-line-items/{lineItemId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeLineItem(@PathVariable Long lineItemId) {
        invoiceService.removeLineItem(lineItemId);
    }

    @PostMapping("/company/invoices/{invoiceId}/issue")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<InvoiceDetailResponse> issueCompanyInvoice(@PathVariable Long invoiceId) {
        return ApiResponse.success(invoiceService.issueCompanyInvoice(invoiceId));
    }

    @PostMapping("/company/invoices/{invoiceId}/void")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<InvoiceDetailResponse> voidCompanyInvoice(@PathVariable Long invoiceId,
            @Valid @RequestBody VoidInvoiceRequest request) {
        return ApiResponse.success(invoiceService.voidCompanyInvoice(invoiceId, request));
    }

    @PostMapping("/company/billing/preview")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<BillingPreviewResponse> previewManualGeneration(
            @Valid @RequestBody BillingPreviewRequest request) {
        return ApiResponse.success(invoiceService.previewManualGeneration(request));
    }

    @PostMapping("/company/invoices/generate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceDetailResponse> generateManualInvoice(
            @Valid @RequestBody ManualInvoiceGenerationRequest request) {
        return ApiResponse.success(invoiceService.generateManualInvoice(request));
    }
}
