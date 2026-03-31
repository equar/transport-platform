package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentReportRowResponse(
        Long id,
        String paymentNumber,
        PaymentStatus status,
        PaymentMethod paymentMethod,
        LocalDate paymentDate,
        BigDecimal amount,
        String invoiceNumber,
        String payerName,
        String referenceNumber) {
}