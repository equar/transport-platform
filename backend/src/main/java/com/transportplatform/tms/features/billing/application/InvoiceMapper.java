package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.api.request.InvoiceLineItemUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.BillingPreviewResponse;
import com.transportplatform.tms.features.billing.api.response.CollectionNoteResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceDetailResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceLineItemResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InvoiceMapper {

    public void apply(Invoice invoice,
            InvoiceUpsertRequest request,
            BillingReferenceValidationService.ResolvedBillTo billTo) {
        invoice.setBillToType(request.billToType());
        invoice.setBillToId(billTo.billToId());
        invoice.setBillToNameSnapshot(billTo.billToName());
        invoice.setRiderId(billTo.riderId());
        invoice.setGuardianId(billTo.guardianId());
        invoice.setOrganizationId(billTo.organizationId());
        invoice.setContractId(billTo.contractId());
        invoice.setBillingPeriodStart(request.billingPeriodStart());
        invoice.setBillingPeriodEnd(request.billingPeriodEnd());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDueDate(request.dueDate());
        invoice.setTaxAmount(zeroIfNull(request.taxAmount()));
        invoice.setDiscountAmount(zeroIfNull(request.discountAmount()));
        invoice.setCurrency(request.currency().trim().toUpperCase());
        invoice.setNotes(trimToNull(request.notes()));
    }

    public InvoiceLineItem toLineItem(Invoice invoice, InvoiceLineItemUpsertRequest request) {
        InvoiceLineItem lineItem = new InvoiceLineItem();
        lineItem.setTenantId(invoice.getTenantId());
        lineItem.setInvoice(invoice);
        apply(lineItem, request);
        return lineItem;
    }

    public void apply(InvoiceLineItem lineItem, InvoiceLineItemUpsertRequest request) {
        lineItem.setDescription(request.description().trim());
        lineItem.setChargeSourceType(request.chargeSourceType());
        lineItem.setSourceReferenceId(request.sourceReferenceId());
        lineItem.setPricingRuleId(request.pricingRuleId());
        lineItem.setQuantity(request.quantity());
        lineItem.setUnitPrice(request.unitPrice());
        lineItem.setLineAmount(request.quantity().multiply(request.unitPrice()));
        lineItem.setServiceDate(request.serviceDate());
        lineItem.setServicePeriodLabel(trimToNull(request.servicePeriodLabel()));
        lineItem.setNotes(trimToNull(request.notes()));
    }

    public InvoiceSummaryResponse toSummary(Invoice invoice,
            InvoiceStatus effectiveStatus,
            Integer daysPastDue,
            InvoiceAgingBucket agingBucket) {
        return new InvoiceSummaryResponse(
                invoice.getId(),
                invoice.getTenantId(),
                invoice.getInvoiceNumber(),
                invoice.getBillToType(),
                invoice.getBillToId(),
                invoice.getBillToNameSnapshot(),
                invoice.getContractId(),
                invoice.getOrganizationId(),
                invoice.getRiderId(),
                invoice.getGuardianId(),
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.getBillingPeriodStart(),
                invoice.getBillingPeriodEnd(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getDiscountAmount(),
                invoice.getTotalAmount(),
                invoice.getAmountPaid(),
                invoice.getBalanceDue(),
                invoice.getCurrency(),
                invoice.getNotes(),
                effectiveStatus,
                daysPastDue,
                agingBucket,
                invoice.getCreatedBy(),
                invoice.getCreatedAt(),
                invoice.getUpdatedBy(),
                invoice.getUpdatedAt());
    }

    public InvoiceDetailResponse toDetail(Invoice invoice,
            InvoiceStatus effectiveStatus,
            Integer daysPastDue,
            InvoiceAgingBucket agingBucket,
            List<InvoiceLineItemResponse> lineItems,
            List<PaymentSummaryResponse> payments,
            List<CollectionNoteResponse> collectionNotes) {
        return new InvoiceDetailResponse(
                invoice.getId(),
                invoice.getTenantId(),
                invoice.getInvoiceNumber(),
                invoice.getBillToType(),
                invoice.getBillToId(),
                invoice.getBillToNameSnapshot(),
                invoice.getContractId(),
                invoice.getOrganizationId(),
                invoice.getRiderId(),
                invoice.getGuardianId(),
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.getBillingPeriodStart(),
                invoice.getBillingPeriodEnd(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getDiscountAmount(),
                invoice.getTotalAmount(),
                invoice.getAmountPaid(),
                invoice.getBalanceDue(),
                invoice.getCurrency(),
                invoice.getNotes(),
                invoice.getVoidReason(),
                effectiveStatus,
                daysPastDue,
                agingBucket,
                invoice.getCreatedBy(),
                invoice.getCreatedAt(),
                invoice.getUpdatedBy(),
                invoice.getUpdatedAt(),
                lineItems,
                payments,
                collectionNotes);
    }

    public InvoiceLineItemResponse toLineItemResponse(InvoiceLineItem lineItem) {
        return new InvoiceLineItemResponse(
                lineItem.getId(),
                lineItem.getInvoice().getId(),
                lineItem.getLineNumber(),
                lineItem.getDescription(),
                lineItem.getChargeSourceType(),
                lineItem.getSourceReferenceId(),
                lineItem.getPricingRuleId(),
                lineItem.getQuantity(),
                lineItem.getUnitPrice(),
                lineItem.getLineAmount(),
                lineItem.getServiceDate(),
                lineItem.getServicePeriodLabel(),
                lineItem.getNotes(),
                lineItem.getCreatedBy(),
                lineItem.getCreatedAt(),
                lineItem.getUpdatedBy(),
                lineItem.getUpdatedAt());
    }

    public BillingPreviewResponse toPreview(BillingReferenceValidationService.ResolvedBillTo billTo,
            Long pricingRuleId,
            String pricingRuleCode,
            String pricingRuleName,
            Invoice draftInvoice,
            String manualOverrideNote,
            boolean manualOverrideApplied,
            List<InvoiceLineItemResponse> lineItems) {
        return new BillingPreviewResponse(
                billTo.billToType(),
                billTo.billToId(),
                billTo.billToName(),
                pricingRuleId,
                pricingRuleCode,
                pricingRuleName,
                draftInvoice.getBillingPeriodStart(),
                draftInvoice.getBillingPeriodEnd(),
                draftInvoice.getCurrency(),
                draftInvoice.getSubtotal(),
                draftInvoice.getTaxAmount(),
                draftInvoice.getDiscountAmount(),
                draftInvoice.getTotalAmount(),
                manualOverrideApplied,
                manualOverrideNote,
                lineItems);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
