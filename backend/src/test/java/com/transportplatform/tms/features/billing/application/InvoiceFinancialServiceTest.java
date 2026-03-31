package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class InvoiceFinancialServiceTest {

    private final InvoiceFinancialService service = new InvoiceFinancialService();

    @Test
    void recalculateTotalsUpdatesInvoiceAmountsAndKeepsDraftStatus() {
        Invoice invoice = new Invoice();
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setTaxAmount(new BigDecimal("4.25"));
        invoice.setDiscountAmount(new BigDecimal("1.25"));
        invoice.setAmountPaid(BigDecimal.ZERO);

        service.recalculateTotals(invoice, List.of(lineItem("25.00"), lineItem("10.00")), LocalDate.of(2026, 3, 31));

        assertEquals(new BigDecimal("35.00"), invoice.getSubtotal());
        assertEquals(new BigDecimal("38.00"), invoice.getTotalAmount());
        assertEquals(new BigDecimal("38.00"), invoice.getBalanceDue());
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
    }

    @Test
    void applyPaymentMovesInvoiceToPartiallyPaidAndAssignsAgingBucket() {
        Invoice invoice = new Invoice();
        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setDueDate(LocalDate.of(2026, 3, 1));
        invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setAmountPaid(BigDecimal.ZERO.setScale(2));
        invoice.setBalanceDue(new BigDecimal("100.00"));

        service.applyPayment(invoice, new BigDecimal("40.00"), LocalDate.of(2026, 3, 31));

        assertEquals(new BigDecimal("40.00"), invoice.getAmountPaid());
        assertEquals(new BigDecimal("60.00"), invoice.getBalanceDue());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, invoice.getStatus());
        assertEquals(30, service.resolveDaysPastDue(invoice, LocalDate.of(2026, 3, 31)));
        assertEquals(InvoiceAgingBucket.DAYS_1_TO_30,
                service.resolveAgingBucket(invoice, LocalDate.of(2026, 3, 31)));
    }

    @Test
    void reversePaymentReopensReceivableAndPaidInvoicesDoNotReturnAgingBucket() {
        Invoice invoice = new Invoice();
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setDueDate(LocalDate.of(2026, 3, 1));
        invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setAmountPaid(new BigDecimal("100.00"));
        invoice.setBalanceDue(BigDecimal.ZERO.setScale(2));

        service.reversePayment(invoice, new BigDecimal("25.00"), LocalDate.of(2026, 3, 31));

        assertEquals(new BigDecimal("75.00"), invoice.getAmountPaid());
        assertEquals(new BigDecimal("25.00"), invoice.getBalanceDue());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, invoice.getStatus());

        Invoice voidInvoice = new Invoice();
        voidInvoice.setStatus(InvoiceStatus.VOID);
        voidInvoice.setBalanceDue(new BigDecimal("25.00"));

        assertNull(service.resolveAgingBucket(voidInvoice, LocalDate.of(2026, 3, 31)));
    }

    private InvoiceLineItem lineItem(String amount) {
        InvoiceLineItem lineItem = new InvoiceLineItem();
        lineItem.setLineAmount(new BigDecimal(amount));
        return lineItem;
    }
}