package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

public final class InvoiceStatusWorkflow {

    private InvoiceStatusWorkflow() {
    }

    public static void ensureDraftEditable(Invoice invoice, LocalDate today) {
        if (resolveEffectiveStatus(invoice, today) != InvoiceStatus.DRAFT) {
            throw invalidTransition("Only draft invoices can be modified.");
        }
    }

    public static void ensureCanIssue(Invoice invoice, LocalDate today) {
        if (resolveEffectiveStatus(invoice, today) != InvoiceStatus.DRAFT) {
            throw invalidTransition("Only draft invoices can be issued.");
        }
    }

    public static void ensureCanVoid(Invoice invoice, LocalDate today) {
        InvoiceStatus effectiveStatus = resolveEffectiveStatus(invoice, today);
        if (effectiveStatus == InvoiceStatus.VOID || effectiveStatus == InvoiceStatus.PAID) {
            throw invalidTransition("Paid or void invoices cannot be voided.");
        }
    }

    public static InvoiceStatus resolveEffectiveStatus(Invoice invoice, LocalDate today) {
        if ((invoice.getStatus() == InvoiceStatus.ISSUED || invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID)
                && invoice.getBalanceDue() != null
                && invoice.getBalanceDue().compareTo(BigDecimal.ZERO) > 0
                && invoice.getDueDate() != null
                && invoice.getDueDate().isBefore(today)) {
            return InvoiceStatus.OVERDUE;
        }
        return invoice.getStatus();
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}
