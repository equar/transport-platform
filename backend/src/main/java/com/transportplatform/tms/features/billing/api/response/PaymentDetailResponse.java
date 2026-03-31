package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PaymentDetailResponse(
        Long id,
        String tenantId,
        String paymentNumber,
        Long invoiceId,
        String invoiceNumber,
        String billToNameSnapshot,
        InvoiceStatus invoiceStatus,
        BigDecimal invoiceTotalAmount,
        BigDecimal invoiceAmountPaid,
        BigDecimal invoiceBalanceDue,
        LocalDate paymentDate,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String referenceNumber,
        String payerName,
        String payerContact,
        String externalTransactionId,
        String notes,
        String voidReason,
        PaymentStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}