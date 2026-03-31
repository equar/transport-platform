package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceReportRowResponse(
        Long id,
        String invoiceNumber,
        InvoiceStatus status,
        BillToType billToType,
        String billToName,
        LocalDate invoiceDate,
        LocalDate dueDate,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        String currency) {
}