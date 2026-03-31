package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.BillToType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceUpsertRequest(
        @NotNull(message = "Bill-to type is required.") BillToType billToType,
        @NotNull(message = "Bill-to target is required.") Long billToId,
        LocalDate billingPeriodStart,
        LocalDate billingPeriodEnd,
        @NotNull(message = "Invoice date is required.") LocalDate invoiceDate,
        @NotNull(message = "Due date is required.") LocalDate dueDate,
        @DecimalMin(value = "0.00", message = "Tax amount cannot be negative.") BigDecimal taxAmount,
        @DecimalMin(value = "0.00", message = "Discount amount cannot be negative.") BigDecimal discountAmount,
        @NotBlank(message = "Currency is required.") @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code.") String currency,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}
