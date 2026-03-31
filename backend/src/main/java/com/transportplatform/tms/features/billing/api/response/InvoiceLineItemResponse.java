package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InvoiceLineItemResponse(
        Long id,
        Long invoiceId,
        Integer lineNumber,
        String description,
        ChargeSourceType chargeSourceType,
        Long sourceReferenceId,
        Long pricingRuleId,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineAmount,
        LocalDate serviceDate,
        String servicePeriodLabel,
        String notes,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}
