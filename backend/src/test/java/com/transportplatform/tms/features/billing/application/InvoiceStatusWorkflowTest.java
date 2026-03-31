package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class InvoiceStatusWorkflowTest {

    @Test
    void resolveEffectiveStatusMarksIssuedInvoiceAsOverdueWhenBalanceRemains() {
        Invoice invoice = invoice(InvoiceStatus.ISSUED, LocalDate.of(2026, 3, 15), new BigDecimal("125.00"));

        InvoiceStatus effectiveStatus = InvoiceStatusWorkflow.resolveEffectiveStatus(
                invoice,
                LocalDate.of(2026, 3, 31));

        assertEquals(InvoiceStatus.OVERDUE, effectiveStatus);
    }

    @Test
    void ensureCanVoidRejectsPaidInvoice() {
        Invoice invoice = invoice(InvoiceStatus.PAID, LocalDate.of(2026, 3, 31), BigDecimal.ZERO);

        ApiException exception = assertThrows(ApiException.class,
                () -> InvoiceStatusWorkflow.ensureCanVoid(invoice, LocalDate.of(2026, 3, 31)));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void ensureDraftEditableAllowsDraftInvoice() {
        Invoice invoice = invoice(InvoiceStatus.DRAFT, LocalDate.of(2026, 4, 10), new BigDecimal("50.00"));

        assertDoesNotThrow(() -> InvoiceStatusWorkflow.ensureDraftEditable(invoice, LocalDate.of(2026, 3, 31)));
    }

    private Invoice invoice(InvoiceStatus status, LocalDate dueDate, BigDecimal balanceDue) {
        Invoice invoice = new Invoice();
        invoice.setStatus(status);
        invoice.setDueDate(dueDate);
        invoice.setBalanceDue(balanceDue);
        return invoice;
    }
}