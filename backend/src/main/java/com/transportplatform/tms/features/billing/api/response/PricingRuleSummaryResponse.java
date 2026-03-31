package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PricingRuleSummaryResponse(
        Long id,
        String tenantId,
        String pricingRuleCode,
        String name,
        PricingModel pricingModel,
        BillToType billToType,
        ServiceType serviceType,
        BigDecimal amount,
        String currency,
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        Integer priorityOrder,
        PricingRuleStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}
