package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InvoiceFinancialService {

    public void recalculateTotals(Invoice invoice, List<InvoiceLineItem> lineItems, LocalDate today) {
        BigDecimal subtotal = lineItems.stream()
                .map(InvoiceLineItem::getLineAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = zeroIfNull(invoice.getTaxAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = zeroIfNull(invoice.getDiscountAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal amountPaid = zeroIfNull(invoice.getAmountPaid()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal balanceDue = totalAmount.subtract(amountPaid).setScale(2, RoundingMode.HALF_UP);
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setDiscountAmount(discountAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setAmountPaid(amountPaid);
        invoice.setBalanceDue(balanceDue);
        synchronizeInvoiceStatus(invoice, today);
    }

    public BigDecimal applyPayment(Invoice invoice, BigDecimal amount, LocalDate today) {
        invoice.setAmountPaid(zeroIfNull(invoice.getAmountPaid()).add(amount).setScale(2, RoundingMode.HALF_UP));
        invoice.setBalanceDue(zeroIfNull(invoice.getTotalAmount()).subtract(invoice.getAmountPaid())
                .setScale(2, RoundingMode.HALF_UP));
        synchronizeInvoiceStatus(invoice, today);
        return invoice.getBalanceDue();
    }

    public BigDecimal reversePayment(Invoice invoice, BigDecimal amount, LocalDate today) {
        invoice.setAmountPaid(zeroIfNull(invoice.getAmountPaid()).subtract(amount).setScale(2, RoundingMode.HALF_UP));
        invoice.setBalanceDue(zeroIfNull(invoice.getTotalAmount()).subtract(invoice.getAmountPaid())
                .setScale(2, RoundingMode.HALF_UP));
        synchronizeInvoiceStatus(invoice, today);
        return invoice.getBalanceDue();
    }

    public BigDecimal previewResultingBalance(Invoice invoice, BigDecimal amount) {
        return zeroIfNull(invoice.getBalanceDue()).subtract(zeroIfNull(amount)).setScale(2, RoundingMode.HALF_UP);
    }

    public InvoiceStatus previewResultingStatus(Invoice invoice, BigDecimal amount, LocalDate today) {
        BigDecimal resultingBalance = previewResultingBalance(invoice, amount);
        if (resultingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            return InvoiceStatus.PAID;
        }
        if (zeroIfNull(invoice.getAmountPaid()).add(amount).compareTo(BigDecimal.ZERO) > 0) {
            return InvoiceStatusWorkflow
                    .resolveEffectiveStatus(statusPreviewInvoice(invoice, InvoiceStatus.PARTIALLY_PAID,
                            resultingBalance), today);
        }
        return InvoiceStatusWorkflow.resolveEffectiveStatus(statusPreviewInvoice(invoice, InvoiceStatus.ISSUED,
                resultingBalance), today);
    }

    public int resolveDaysPastDue(Invoice invoice, LocalDate today) {
        if (!isReceivable(invoice) || invoice.getDueDate() == null || !invoice.getDueDate().isBefore(today)) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(invoice.getDueDate(), today);
    }

    public InvoiceAgingBucket resolveAgingBucket(Invoice invoice, LocalDate today) {
        if (!isReceivable(invoice)) {
            return null;
        }
        int daysPastDue = resolveDaysPastDue(invoice, today);
        if (daysPastDue <= 0) {
            return InvoiceAgingBucket.CURRENT;
        }
        if (daysPastDue <= 30) {
            return InvoiceAgingBucket.DAYS_1_TO_30;
        }
        if (daysPastDue <= 60) {
            return InvoiceAgingBucket.DAYS_31_TO_60;
        }
        if (daysPastDue <= 90) {
            return InvoiceAgingBucket.DAYS_61_TO_90;
        }
        return InvoiceAgingBucket.DAYS_90_PLUS;
    }

    public boolean isReceivable(Invoice invoice) {
        return invoice.getStatus() != InvoiceStatus.DRAFT
                && invoice.getStatus() != InvoiceStatus.VOID
                && zeroIfNull(invoice.getBalanceDue()).compareTo(BigDecimal.ZERO) > 0;
    }

    private void synchronizeInvoiceStatus(Invoice invoice, LocalDate today) {
        if (invoice.getStatus() == InvoiceStatus.DRAFT || invoice.getStatus() == InvoiceStatus.VOID) {
            return;
        }
        if (zeroIfNull(invoice.getBalanceDue()).compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            return;
        }
        if (zeroIfNull(invoice.getAmountPaid()).compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            return;
        }
        invoice.setStatus(InvoiceStatus.ISSUED);
        if (InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today) == InvoiceStatus.OVERDUE) {
            invoice.setStatus(InvoiceStatus.ISSUED);
        }
    }

    private Invoice statusPreviewInvoice(Invoice source, InvoiceStatus status, BigDecimal balanceDue) {
        Invoice preview = new Invoice();
        preview.setStatus(status);
        preview.setDueDate(source.getDueDate());
        preview.setBalanceDue(balanceDue);
        return preview;
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}