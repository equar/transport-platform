package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InvoiceSummaryResponse(
        Long id,
        String tenantId,
        String invoiceNumber,
        BillToType billToType,
        Long billToId,
        String billToNameSnapshot,
        Long contractId,
        Long organizationId,
        Long riderId,
        Long guardianId,
        LocalDate invoiceDate,
        LocalDate dueDate,
        LocalDate billingPeriodStart,
        LocalDate billingPeriodEnd,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        String currency,
        String notes,
        InvoiceStatus status,
        Integer daysPastDue,
        InvoiceAgingBucket agingBucket,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}
