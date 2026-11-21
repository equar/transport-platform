package com.transportplatform.tms.features.billing.api.adjustment;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public final class BillingAdjustmentRecords {
    private BillingAdjustmentRecords() {}

    public record RefundRequest(
            @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2)
                    BigDecimal amount,
            @NotBlank @Size(max = 150) String reference,
            @NotBlank @Size(max = 1000) String reason) {}

    public record CreditRequest(
            @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2)
                    BigDecimal amount,
            @NotBlank @Size(max = 1000) String reason) {}

    public record ApplyCreditRequest(
            @NotNull @Min(1) Long invoiceId,
            @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2)
                    BigDecimal amount) {}

    public record VoidCreditRequest(@NotBlank @Size(max = 1000) String reason) {}

    public record Refund(
            long id,
            long paymentId,
            long invoiceId,
            BigDecimal amount,
            String currency,
            String reference,
            String reason,
            Instant createdAt) {}

    public record CreditNote(
            long id,
            long sourceInvoiceId,
            String number,
            BigDecimal amount,
            BigDecimal usedAmount,
            BigDecimal availableAmount,
            String currency,
            String status,
            String reason,
            Instant createdAt) {}

    public record CreditApplication(
            long id,
            long creditNoteId,
            long invoiceId,
            long paymentId,
            BigDecimal amount,
            String currency) {}
}
