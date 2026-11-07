package com.transportplatform.tms.features.billing.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.billing.api.request.CollectionNoteUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.CollectionNoteResponse;
import com.transportplatform.tms.features.billing.api.response.ReceivablesSummaryResponse;
import com.transportplatform.tms.features.billing.application.ReceivablesService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReceivablesManagementController {

    private final ReceivablesService receivablesService;

    public ReceivablesManagementController(ReceivablesService receivablesService) {
        this.receivablesService = receivablesService;
    }

    @GetMapping("/company/receivables/summary")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<ReceivablesSummaryResponse> getCompanyReceivablesSummary() {
        return ApiResponse.success(receivablesService.getCompanyReceivablesSummary());
    }

    @GetMapping("/company/invoices/{invoiceId}/collection-notes")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    public ApiResponse<List<CollectionNoteResponse>> listCompanyInvoiceCollectionNotes(@PathVariable Long invoiceId) {
        return ApiResponse.success(receivablesService.listCompanyInvoiceCollectionNotes(invoiceId));
    }

    @PostMapping("/company/invoices/{invoiceId}/collection-notes")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'BILLING_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CollectionNoteResponse> addCollectionNote(@PathVariable Long invoiceId,
            @Valid @RequestBody CollectionNoteUpsertRequest request) {
        return ApiResponse.success(receivablesService.addCollectionNote(invoiceId, request));
    }
}
