package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceLineItemUpsertRequest(
        @NotBlank(message = "Description is required.") @Size(max = 250, message = "Description must be 250 characters or fewer.") String description,
        @NotNull(message = "Charge source type is required.") ChargeSourceType chargeSourceType,
        Long sourceReferenceId,
        Long pricingRuleId,
        @NotNull(message = "Quantity is required.") @DecimalMin(value = "0.01", message = "Quantity must be greater than zero.") BigDecimal quantity,
        @NotNull(message = "Unit price is required.") @DecimalMin(value = "0.00", message = "Unit price cannot be negative.") BigDecimal unitPrice,
        LocalDate serviceDate,
        @Size(max = 120, message = "Service period label must be 120 characters or fewer.") String servicePeriodLabel,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}
