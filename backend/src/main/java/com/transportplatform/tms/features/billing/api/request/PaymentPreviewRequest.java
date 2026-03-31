package com.transportplatform.tms.features.billing.api.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentPreviewRequest(
        @NotNull(message = "Invoice is required.") Long invoiceId,
        @NotNull(message = "Payment amount is required.") @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero.") BigDecimal amount) {
}