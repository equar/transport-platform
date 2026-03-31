package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.api.request.PaymentUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.PaymentDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public void apply(Payment payment, PaymentUpsertRequest request) {
        payment.setPaymentDate(request.paymentDate());
        payment.setAmount(request.amount().setScale(2));
        payment.setPaymentMethod(request.paymentMethod());
        payment.setReferenceNumber(trimToNull(request.referenceNumber()));
        payment.setPayerName(trimToNull(request.payerName()));
        payment.setPayerContact(trimToNull(request.payerContact()));
        payment.setExternalTransactionId(trimToNull(request.externalTransactionId()));
        payment.setNotes(trimToNull(request.notes()));
    }

    public PaymentSummaryResponse toSummary(Payment payment, InvoiceStatus effectiveInvoiceStatus) {
        return new PaymentSummaryResponse(
                payment.getId(),
                payment.getTenantId(),
                payment.getPaymentNumber(),
                payment.getInvoice().getId(),
                payment.getInvoice().getInvoiceNumber(),
                payment.getInvoice().getBillToNameSnapshot(),
                effectiveInvoiceStatus,
                payment.getPaymentDate(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getReferenceNumber(),
                payment.getPayerName(),
                payment.getPayerContact(),
                payment.getStatus(),
                payment.getCreatedBy(),
                payment.getCreatedAt(),
                payment.getUpdatedBy(),
                payment.getUpdatedAt());
    }

    public PaymentDetailResponse toDetail(Payment payment, InvoiceStatus effectiveInvoiceStatus) {
        return new PaymentDetailResponse(
                payment.getId(),
                payment.getTenantId(),
                payment.getPaymentNumber(),
                payment.getInvoice().getId(),
                payment.getInvoice().getInvoiceNumber(),
                payment.getInvoice().getBillToNameSnapshot(),
                effectiveInvoiceStatus,
                zeroIfNull(payment.getInvoice().getTotalAmount()),
                zeroIfNull(payment.getInvoice().getAmountPaid()),
                zeroIfNull(payment.getInvoice().getBalanceDue()),
                payment.getPaymentDate(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getReferenceNumber(),
                payment.getPayerName(),
                payment.getPayerContact(),
                payment.getExternalTransactionId(),
                payment.getNotes(),
                payment.getVoidReason(),
                payment.getStatus(),
                payment.getCreatedBy(),
                payment.getCreatedAt(),
                payment.getUpdatedBy(),
                payment.getUpdatedAt());
    }

    public PaymentStatus resolveAppliedStatus(BigDecimal resultingBalance) {
        return resultingBalance.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.APPLIED
                : PaymentStatus.PARTIALLY_APPLIED;
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