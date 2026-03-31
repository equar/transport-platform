package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentUpsertRequest(
        @NotNull(message = "Invoice is required.") Long invoiceId,
        @NotNull(message = "Payment date is required.") LocalDate paymentDate,
        @NotNull(message = "Payment amount is required.") @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero.") BigDecimal amount,
        @NotNull(message = "Payment method is required.") PaymentMethod paymentMethod,
        @Size(max = 150, message = "Reference number must be 150 characters or fewer.") String referenceNumber,
        @Size(max = 200, message = "Payer name must be 200 characters or fewer.") String payerName,
        @Size(max = 200, message = "Payer contact must be 200 characters or fewer.") String payerContact,
        @Size(max = 150, message = "External transaction id must be 150 characters or fewer.") String externalTransactionId,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes,
        Boolean applyImmediately) {
}