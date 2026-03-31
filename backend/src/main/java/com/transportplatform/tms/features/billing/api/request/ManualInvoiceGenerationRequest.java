package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ManualInvoiceGenerationRequest(
        @NotNull(message = "Bill-to type is required.") BillToType billToType,
        @NotNull(message = "Bill-to target is required.") Long billToId,
        Long pricingRuleId,
        Long routeId,
        List<Long> rideIds,
        ServiceType serviceType,
        RideTripType tripType,
        LocalDate billingPeriodStart,
        LocalDate billingPeriodEnd,
        @DecimalMin(value = "0.00", message = "Quantity cannot be negative.") BigDecimal quantity,
        Integer tripCount,
        Integer riderCount,
        @NotNull(message = "Invoice date is required.") LocalDate invoiceDate,
        @NotNull(message = "Due date is required.") LocalDate dueDate,
        @NotBlank(message = "Currency is required.") @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code.") String currency,
        @DecimalMin(value = "0.00", message = "Tax amount cannot be negative.") BigDecimal taxAmount,
        @DecimalMin(value = "0.00", message = "Discount amount cannot be negative.") BigDecimal discountAmount,
        @DecimalMin(value = "0.00", inclusive = false, message = "Manual override amount must be greater than zero.") BigDecimal manualOverrideAmount,
        @Size(max = 1000, message = "Manual override note must be 1000 characters or fewer.") String manualOverrideNote,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes,
        @Valid List<InvoiceLineItemUpsertRequest> manualLineItems) {
}
