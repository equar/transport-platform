package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.BillToType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BillingPreviewResponse(
        BillToType billToType,
        Long billToId,
        String billToName,
        Long pricingRuleId,
        String pricingRuleCode,
        String pricingRuleName,
        LocalDate billingPeriodStart,
        LocalDate billingPeriodEnd,
        String currency,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        boolean manualOverrideApplied,
        String manualOverrideNote,
        List<InvoiceLineItemResponse> lineItems) {
}
