package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;

public record PaymentPreviewResponse(
        Long invoiceId,
        String invoiceNumber,
        String billToNameSnapshot,
        BigDecimal currentBalance,
        BigDecimal paymentAmount,
        BigDecimal resultingBalance,
        InvoiceStatus resultingInvoiceStatus) {
}